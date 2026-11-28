#!/usr/bin/env node
/**
 * Seeds the editorial content of contentstack/articles.cjs: uploads the cover photos (assets/photos,
 * folder "Articles"), creates or updates each article in en-us, writes its fr-fr / it-it / es-es versions,
 * moves every locale to the "Approved" stage of the Review workflow and publishes to development.
 * Idempotent: articles are matched by URL, photos by title.
 *
 *   node scripts/seed-articles.cjs            # all stacks
 *   node scripts/seed-articles.cjs SNOW       # one stack
 *   node scripts/seed-articles.cjs --dry-run
 */
const fs = require("fs");
const path = require("path");
const { managementSDKClient } = require(path.join(process.env.HOME, ".npm-global/lib/node_modules/@contentstack/cli/node_modules/@contentstack/cli-utilities"));
const ARTICLES = require("../contentstack/articles.cjs");

const ROOT = path.join(__dirname, "..");
const ENV = fs.readFileSync(path.join(ROOT, ".env.local"), "utf8");
const DRY = process.argv.includes("--dry-run");
const ONLY = process.argv.slice(2).find((a) => /^[A-Z]+$/.test(a));
const LOCALES = ["en-us", "fr-fr", "it-it", "es-es"];
const ENVIRONMENT = "development";
const FOLDER = "Articles";

const apiKey = (site) => ENV.match(new RegExp(`^VAK_${site}_API_KEY=(.+)$`, "m"))[1].trim();
const slug = (url) => url.split("/").pop();

/** "## Heading" → h2, anything else → paragraph, as a JSON RTE document. */
function rte(blocks, id) {
  return {
    type: "doc",
    uid: `doc_${id}`,
    attrs: {},
    children: blocks.map((b, i) =>
      b.startsWith("## ")
        ? { type: "h2", uid: `${id}_h${i}`, attrs: {}, children: [{ text: b.slice(3) }] }
        : { type: "p", uid: `${id}_p${i}`, attrs: {}, children: [{ text: b }] },
    ),
  };
}

async function folderUid(stack) {
  const res = await stack.asset().query({ query: { is_dir: true, name: FOLDER } }).find();
  const found = (res.items || []).find((f) => f.name === FOLDER);
  return found ? found.uid : (await stack.asset().folder().create({ asset: { name: FOLDER } })).uid;
}

async function coverUid(stack, cover) {
  if (cover.asset) return cover.asset;
  const file = path.join(ROOT, "assets/photos", cover.file);
  const title = path.basename(cover.file, path.extname(cover.file));
  const parent = await folderUid(stack);
  const found = (await stack.asset().query({ query: { parent_uid: parent, title } }).find()).items?.[0];
  if (found) return found.uid;
  const asset = await stack.asset().create({ upload: file, title, parent_uid: parent, tags: ["photo", "article"] });
  console.log(`  uploaded ${cover.file}`);
  return asset.uid;
}

function fields(a, locale, cover) {
  const t = a.i18n[locale];
  return {
    title: t.title,
    url: a.url,
    type: a.type,
    author: a.author,
    published_date: a.published_date,
    cover_image: cover,
    excerpt: t.excerpt,
    body: rte(t.body, `${slug(a.url).replace(/-/g, "_")}_${locale.slice(0, 2)}`),
    related_products: a.related.map((uid) => ({ uid, _content_type_uid: "product" })),
    seo: { meta_title: `${t.title} | ${a.author.replace(" crew", "")}`.slice(0, 60), meta_description: t.meta_description, no_index: false },
    taxonomies: a.taxonomies.map(([taxonomy_uid, term_uid]) => ({ taxonomy_uid, term_uid })),
  };
}

async function approvedStage(stack) {
  const wf = (await stack.workflow().fetchAll()).items?.find((w) => (w.content_types || []).includes("article"));
  const stage = wf?.workflow_stages.find((s) => s.name === "Approved");
  return stage?.uid;
}

async function seed(client, a) {
  const stack = client.stack({ api_key: apiKey(a.site) });
  console.log(`${a.site} ${a.url}`);
  if (DRY) return;
  const cover = await coverUid(stack, a.cover);
  const ct = stack.contentType("article");
  let uid = (await ct.entry().query({ query: { url: a.url } }).find()).items?.[0]?.uid;
  if (!uid) {
    uid = (await ct.entry().create({ entry: fields(a, "en-us", cover) }, { locale: "en-us" })).uid;
    console.log(`  created ${uid}`);
  }
  for (const locale of LOCALES) {
    const entry = await ct.entry(uid).fetch({ locale });
    Object.assign(entry, fields(a, locale, cover));
    await entry.update({ locale });
  }
  console.log(`  written in ${LOCALES.join(", ")}`);
  const stage = await approvedStage(stack);
  if (stage) {
    for (const locale of LOCALES) {
      await ct
        .entry(uid)
        .setWorkflowStage({ workflow_stage: { uid: stage, comment: "Seeded editorial content, reviewed.", notify: false }, locale })
        .catch((e) => console.log(`  workflow ${locale}: ${e.errorMessage || e.message}`));
    }
  }
  // One call per locale: publishing from en-us with several locales only publishes the master version.
  for (const locale of LOCALES) {
    await ct.entry(uid).publish({ publishDetails: { environments: [ENVIRONMENT], locales: [locale] }, locale });
  }
  console.log(`  published in ${LOCALES.join(", ")}`);
}

async function main() {
  const client = await managementSDKClient({ host: "api.contentstack.io" });
  for (const a of ARTICLES.filter((x) => !ONLY || x.site === ONLY)) await seed(client, a);
}

main().catch((e) => {
  console.error("ERROR", e.errorMessage || e.message, JSON.stringify(e.errors || ""));
  process.exit(1);
});

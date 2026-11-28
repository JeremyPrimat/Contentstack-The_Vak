#!/usr/bin/env node
/**
 * Puts the Vak Snow demo content back in its starting state, so the AXP demo can be replayed:
 *  - Home page: product carousel "Best sellers" in its original order (the Demand agent reorders it),
 *    saved and published to development.
 *  - Campaigns drafted by the Campaign Builder agent (never published) are deleted.
 *  - Guide "Layering for a cold front": back to the draft Polaris works on (off-voice intro, no excerpt,
 *    no SEO, no related products, no fr/it/es versions), unpublished.
 *
 *   node scripts/demo-reset.cjs            # reset
 *   node scripts/demo-reset.cjs --dry-run  # show what would change
 */
const fs = require("fs");
const path = require("path");
const { managementSDKClient } = require(path.join(process.env.HOME, ".npm-global/lib/node_modules/@contentstack/cli/node_modules/@contentstack/cli-utilities"));

const ROOT = path.join(__dirname, "..");
const ENV = fs.readFileSync(path.join(ROOT, ".env.local"), "utf8");
const DRY = process.argv.includes("--dry-run");
const API_KEY = ENV.match(/^VAK_SNOW_API_KEY=(.+)$/m)[1].trim();
const ENVIRONMENT = "development";

const HOME_UID = "blt00c6c7414ceb3ba3";
const CAROUSEL = {
  heading: "Best sellers",
  products: ["blt5bcb1a65355fed4e", "blt26d34241a022338e", "blt6ac027b9e2f3788c", "bltdf91ac893a179c52"], // Polder, Ijs, Mist, Helder
};

const GUIDE_URL = "/guides/layering-for-a-cold-front";
const p = (text, uid) => ({ type: "p", uid, attrs: {}, children: [{ text }] });
const h = (text, uid) => ({ type: "h2", uid, attrs: {}, children: [{ text }] });
const GUIDE = {
  title: "Layering for a cold front",
  url: GUIDE_URL,
  type: "guide",
  author: "Vak Snow crew",
  published_date: "2026-11-28",
  cover_image: "blt91757ae2b38a3aec",
  excerpt: "",
  related_products: [],
  seo: { meta_title: "", meta_description: "", no_index: false },
  taxonomies: [{ taxonomy_uid: "activity", term_uid: "snow" }],
  body: {
    type: "doc",
    uid: "doc_vn_layering",
    attrs: {},
    children: [
      // Deliberately off-voice: Polaris rewrites it with the Vak Snow voice profile.
      p("Get ready for the ULTIMATE winter adventure!!! A massive cold front is coming and our amazing, best-in-class jackets will keep you warm no matter how extreme it gets. Don't miss out, this is the season you have been waiting for!", "p_lay_0"),
      h("Three layers, not one big coat", "h_lay_1"),
      p("A base layer moves sweat away from your skin, a mid layer traps warm air, and a shell keeps wind and snow out. Three thin layers beat one thick jacket, because you can take one off on the drive south and put it back on at the first chair.", "p_lay_1"),
      h("Insulation for the lift, a shell for the storm", "h_lay_2"),
      p("At -15 °C on a chairlift, synthetic insulation keeps you warm even when it gets damp. When the cold front brings wet snow, a 20k/20k shell with taped seams is what keeps the insulation dry.", "p_lay_2"),
      h("Do not forget your eyes", "h_lay_3"),
      p("Cold fronts come with flat light. A lens above 40% VLT and a warm tint will show you the bumps your legs would rather not find by surprise.", "p_lay_3"),
      h("Pack it in the van the night before", "h_lay_4"),
      p("Base layers at the top of the bag, shell on the hook by the door. You are Dutch: the plan is the fun part.", "p_lay_4"),
    ],
  },
};

async function resetHome(stack) {
  const entry = await stack.contentType("page").entry(HOME_UID).fetch({ locale: "en-us" });
  const block = entry.sections.find((s) => s.product_carousel)?.product_carousel;
  if (!block) throw new Error("No product_carousel block on the Vak Snow home");
  const current = block.products.map((r) => r.uid);
  const same = block.heading === CAROUSEL.heading && JSON.stringify(current) === JSON.stringify(CAROUSEL.products);
  console.log(`Home: "${block.heading}" [${current.join(", ")}] → ${same ? "already in its starting state" : `"${CAROUSEL.heading}" [${CAROUSEL.products.join(", ")}]`}`);
  if (DRY) return;
  if (!same) {
    block.heading = CAROUSEL.heading;
    block.products = CAROUSEL.products.map((uid) => ({ uid, _content_type_uid: "product" }));
    await entry.update({ locale: "en-us" });
  }
  // Publish even when unchanged: a published "Trending in the Alps" version must be replaced.
  const fresh = await stack.contentType("page").entry(HOME_UID).fetch({ locale: "en-us" });
  await fresh.publish({ publishDetails: { environments: [ENVIRONMENT], locales: ["en-us"] }, locale: "en-us" });
  console.log("Home: saved and published");
}

async function resetGuide(stack) {
  const found = (await stack.contentType("article").entry().query({ query: { url: GUIDE_URL } }).find()).items[0];
  if (!found) {
    console.log("Guide: missing → created as a draft");
    if (!DRY) await stack.contentType("article").entry().create({ entry: GUIDE }, { locale: "en-us" });
    return;
  }
  const locales = (await stack.contentType("article").entry(found.uid).locales()).locales || [];
  const extra = locales.filter((l) => l.code !== "en-us" && l.localized).map((l) => l.code);
  console.log(`Guide ${found.uid}: back to the Polaris starting draft${extra.length ? `, removing ${extra.join(", ")}` : ""}, unpublished`);
  if (DRY) return;
  const entry = await stack.contentType("article").entry(found.uid).fetch({ locale: "en-us" });
  Object.assign(entry, GUIDE);
  await entry.update({ locale: "en-us" });
  // Deleting with a locale removes only that localized version (the en-us master stays).
  for (const code of extra) await stack.contentType("article").entry(found.uid).delete({ locale: code });
  await stack
    .contentType("article")
    .entry(found.uid)
    .unpublish({ publishDetails: { environments: [ENVIRONMENT], locales: ["en-us", "fr-fr", "it-it", "es-es"] }, locale: "en-us" })
    .catch(() => {}); // never published: nothing to do
}

/** Campaigns drafted by the Vak Campaign Builder agent: deleted when never published, so the demo can run again. */
const KEEP_CAMPAIGNS = new Set(["blt5591a4216559d307"]); // First Tracks
async function resetCampaigns(stack) {
  const items = (await stack.contentType("campaign").entry().query({ include_publish_details: true }).find()).items || [];
  const drafts = items.filter((c) => !KEEP_CAMPAIGNS.has(c.uid) && !(c.publish_details || []).length);
  for (const c of drafts) {
    console.log(`Campaign "${c.title}" (${c.url}): agent draft → deleted`);
    if (!DRY) await stack.contentType("campaign").entry(c.uid).delete();
  }
  if (!drafts.length) console.log("Campaigns: no agent drafts");
}

async function main() {
  const client = await managementSDKClient({ host: "api.contentstack.io" });
  const stack = client.stack({ api_key: API_KEY });
  await resetHome(stack);
  await resetGuide(stack);
  await resetCampaigns(stack);
  console.log(DRY ? "Dry run: nothing changed." : "Vak Snow demo content reset.");
}

main().catch((e) => {
  console.error("ERROR", e.errorMessage || e.message, JSON.stringify(e.errors || ""));
  process.exit(1);
});

// Localizes the site content into fr-fr, it-it and es-es from a translation dictionary.
//
//   node scripts/translate-content.cjs extract   → contentstack/i18n/strings.json (unique English strings)
//   node scripts/translate-content.cjs apply     → localize + publish every entry, per locale
//
// Dictionary: contentstack/i18n/translations.json = { "<English string>": { "fr-fr": "...", "it-it": "...", "es-es": "..." } }
// Only text in the TEXT_KEYS fields (and JSON RTE text nodes) is translated; URLs, SKUs, names, colours,
// prices and other non-localizable values are left alone. Articles are skipped on purpose: guides are
// translated in the CMS with Polaris + the Review workflow (see README, "AI with human review").
// Uses the csdx OAuth session (bulk work that MCP would need ~150 single-locale calls for).
const fs = require("fs");
const path = require("path");
const CLI_UTILS = path.join(process.env.HOME, ".npm-global/lib/node_modules/@contentstack/cli/node_modules/@contentstack/cli-utilities");
const { managementSDKClient, authenticationHandler } = require(CLI_UTILS);

const ROOT = path.join(__dirname, "..");
const DIR = path.join(ROOT, "contentstack/i18n");
const ENV_FILE = path.join(ROOT, ".env.local");
const LOCALES = ["fr-fr", "it-it", "es-es"];
const SITES = ["GROUP", "SURF", "SKATE", "SNOW"];
const CONTENT_TYPES = ["brand", "category", "product", "campaign", "store", "page", "header", "footer"];
const TEXT_KEYS = new Set([
  "title", "tagline", "description", "short_description", "summary", "headline", "eyebrow", "heading", "subheading",
  "label", "intro", "announcement", "newsletter_heading", "newsletter_text", "legal_text", "meta_title",
  "meta_description", "features", "composition", "country",
]);
// Fields whose value is a link object: translate its visible title only.
const LINK_KEYS = new Set(["link", "links", "utility_links"]);

const apiKey = (site) => fs.readFileSync(ENV_FILE, "utf8").match(new RegExp(`^VAK_${site}_API_KEY=(.+)$`, "m"))[1].trim();
const SYSTEM = new Set(["uid", "_version", "locale", "created_at", "updated_at", "created_by", "updated_by", "ACL", "_in_progress", "tags", "publish_details", "_metadata", "_workflow", "_rules"]);

/** Walk an entry and call fn(value, setter) for every translatable string. */
function walk(node, fn, key) {
  if (node == null) return;
  if (Array.isArray(node)) {
    node.forEach((v, i) => {
      if (typeof v === "string") {
        if (TEXT_KEYS.has(key)) fn(v, (nv) => (node[i] = nv));
      } else walk(v, fn, key);
    });
    return;
  }
  if (typeof node !== "object") return;
  if (isAsset(node)) return; // asset titles are file names, not copy
  if (node.type === "doc" && Array.isArray(node.children)) return walkRte(node, fn);
  for (const [k, v] of Object.entries(node)) {
    if (SYSTEM.has(k) || k === "_content_type_uid") continue;
    if (typeof v === "string") {
      if (TEXT_KEYS.has(k) || (LINK_KEYS.has(key) && k === "title")) fn(v, (nv) => (node[k] = nv));
    } else walk(v, fn, k);
  }
}
function isAsset(node) {
  return node && typeof node === "object" && typeof node.uid === "string" && "filename" in node && "url" in node;
}
/** Expanded assets → uid strings, as the CMA expects on write. */
function assetsToUids(node) {
  if (Array.isArray(node)) return node.map(assetsToUids);
  if (node && typeof node === "object") {
    if (isAsset(node)) return node.uid;
    for (const k of Object.keys(node)) node[k] = assetsToUids(node[k]);
  }
  return node;
}
function walkRte(node, fn) {
  if (typeof node.text === "string" && node.text.trim()) fn(node.text, (nv) => (node.text = nv));
  (node.children || []).forEach((c) => walkRte(c, fn));
}

async function client() {
  await authenticationHandler.getAuthDetails();
  return managementSDKClient({ host: "api.contentstack.io" });
}

async function eachEntry(c, cb) {
  for (const site of SITES) {
    const stack = c.stack({ api_key: apiKey(site) });
    for (const ct of CONTENT_TYPES) {
      const res = await stack.contentType(ct).entry().query({ locale: "en-us", limit: 100 }).find();
      for (const entry of res.items || []) await cb(site, stack, ct, entry);
    }
  }
}

async function extract() {
  const c = await client();
  const strings = new Map();
  await eachEntry(c, async (site, _s, ct, entry) => {
    walk(entry, (v) => {
      if (!strings.has(v)) strings.set(v, new Set());
      strings.get(v).add(`${site}/${ct}`);
    });
  });
  fs.mkdirSync(DIR, { recursive: true });
  const out = Object.fromEntries([...strings].map(([s, where]) => [s, [...where].join(", ")]));
  fs.writeFileSync(path.join(DIR, "strings.json"), JSON.stringify(out, null, 2));
  const words = [...strings.keys()].join(" ").split(/\s+/).length;
  console.log(`${strings.size} unique strings, ~${words} words → contentstack/i18n/strings.json`);
}

async function apply() {
  const dict = JSON.parse(fs.readFileSync(path.join(DIR, "translations.json"), "utf8"));
  const c = await client();
  const missing = new Set();
  let count = 0;
  await eachEntry(c, async (site, stack, ct, base) => {
    for (const locale of LOCALES) {
      const data = JSON.parse(JSON.stringify(base));
      walk(data, (v, set) => {
        const t = dict[v]?.[locale];
        if (t) set(t);
        else if (!(v in dict)) missing.add(v); // listed with null = keep English on purpose (names)
      });
      for (const k of SYSTEM) delete data[k];
      assetsToUids(data);
      const entry = stack.contentType(ct).entry(base.uid);
      // PUT with ?locale=<locale> creates/updates the localized version.
      await c.axiosInstance.put(`/content_types/${ct}/entries/${base.uid}`, { entry: data }, { params: { locale }, headers: { api_key: stack.api_key } });
      await entry.publish({ publishDetails: { environments: ["development"], locales: [locale] }, locale });
      count++;
    }
    console.log(`${site}: ${ct} ${base.title}`);
  });
  console.log(`\n${count} localized versions published.`);
  if (missing.size) console.log(`Untranslated strings kept in English (${missing.size}):\n  ${[...missing].slice(0, 40).join("\n  ")}`);
}

const mode = process.argv[2];
(mode === "extract" ? extract() : mode === "apply" ? apply() : Promise.reject(new Error("usage: extract | apply"))).catch((e) => {
  console.error("ERROR", e.errorMessage || e.message, JSON.stringify(e.errors || e.response?.data || ""));
  process.exit(1);
});

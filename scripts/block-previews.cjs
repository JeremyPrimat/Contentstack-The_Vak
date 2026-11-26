#!/usr/bin/env node
/**
 * Adds a preview image and a category to each block of the Page "sections" field, in every stack,
 * so editors pick blocks from a visual "Add Block" menu (entry editor and Visual Editor).
 * Images: screenshots of the live sites in assets/block-previews/ (made by scripts/shoot-block-previews.cjs).
 * Idempotent: an asset with the same title in the "Block previews" folder is reused (replaced if the file changed).
 *
 *   node scripts/block-previews.cjs
 */
const fs = require("fs");
const path = require("path");
const { managementSDKClient } = require(path.join(process.env.HOME, ".npm-global/lib/node_modules/@contentstack/cli/node_modules/@contentstack/cli-utilities"));

const ROOT = path.join(__dirname, "..");
const DIR = path.join(ROOT, "assets/block-previews");
const ENV = fs.readFileSync(path.join(ROOT, ".env.local"), "utf8");
const SITES = ["GROUP", "SURF", "SKATE", "SNOW"];
const FOLDER = "Block previews";
const CATEGORIES = [
  { uid: "heroes", title: "Heroes and campaigns", block_uids: ["hero_carousel", "campaign_banner"] },
  { uid: "commerce", title: "Products and categories", block_uids: ["product_carousel", "category_tiles"] },
  { uid: "brand", title: "Brand and stores", block_uids: ["universe_tiles", "brand_grid", "story_block", "store_list"] },
];

const apiKey = (site) => ENV.match(new RegExp(`^VAK_${site}_API_KEY=(.+)$`, "m"))[1].trim();

async function folderUid(stack) {
  const res = await stack.asset().query({ query: { is_dir: true, name: FOLDER } }).find();
  const found = (res.items || []).find((f) => f.name === FOLDER);
  return found ? found.uid : (await stack.asset().folder().create({ asset: { name: FOLDER } })).uid;
}

async function main() {
  const client = await managementSDKClient({ host: "api.contentstack.io" });
  for (const site of SITES) {
    const stack = client.stack({ api_key: apiKey(site) });
    const ct = await stack.contentType("page").fetch();
    const field = ct.schema.find((f) => f.uid === "sections" && f.data_type === "blocks");
    const parent = await folderUid(stack);
    for (const block of field.blocks) {
      const file = path.join(DIR, `${block.uid}.jpg`);
      if (!fs.existsSync(file)) continue;
      const title = `block-preview-${block.uid}`;
      let asset = (await stack.asset().query({ query: { parent_uid: parent, title } }).find()).items?.[0];
      if (!asset) asset = await stack.asset().create({ upload: file, title, parent_uid: parent, tags: ["block-preview"] });
      else if (Number(asset.file_size) !== fs.statSync(file).size) asset = await (await stack.asset(asset.uid).fetch()).replace({ upload: file, title });
      block.preview_img = asset.uid;
    }
    const present = new Set(field.blocks.map((b) => b.uid));
    field.categories = CATEGORIES.map((c) => ({ ...c, block_uids: c.block_uids.filter((u) => present.has(u)) })).filter((c) => c.block_uids.length);
    await ct.update();
    console.log(`${site}: ${field.blocks.filter((b) => b.preview_img).length}/${field.blocks.length} block previews, ${field.categories.length} categories`);
  }
}

main().catch((e) => {
  console.error("ERROR", e.errorMessage || e.message, JSON.stringify(e.errors || ""));
  process.exit(1);
});

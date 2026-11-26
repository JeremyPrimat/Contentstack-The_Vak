const { chromium } = require("playwright");
// Screenshots each Page block on the live sites for the block preview images.
// Needs Playwright (not a project dependency): npm i playwright && npx playwright install chromium
const OUT = require("path").join(__dirname, "..", "assets/block-previews");
const G = "https://the-vak.contentstackapps.com", S = "https://vak-surf.contentstackapps.com";
const SHOTS = [
  [G + "/", 0, "hero_carousel"], [G + "/", 1, "universe_tiles"], [G + "/", 2, "campaign_banner"], [G + "/", 3, "story_block"], [G + "/", 4, "brand_grid"],
  [G + "/stores", 0, "store_list"], [S + "/", 1, "category_tiles"], [S + "/", 2, "product_carousel"],
];
(async () => {
  require("fs").mkdirSync(OUT, { recursive: true });
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
  for (const [url, i, name] of SHOTS) {
    if (p.url() !== url) { await p.goto(url, { waitUntil: "networkidle" }); await p.addStyleTag({ content: "header, .site-header, [class*=header] { position: static !important; }" }); }
    const s = p.locator("section").nth(i);
    await s.scrollIntoViewIfNeeded();
    await p.waitForLoadState("networkidle");
    await p.waitForTimeout(800);
    const box = await s.boundingBox();
    const top = box.y + (await p.evaluate(() => window.scrollY));
    await p.screenshot({ path: `${OUT}/${name}.jpg`, type: "jpeg", quality: 85, fullPage: true, clip: { x: 0, y: top, width: 1280, height: 560 } });
    console.log("shot", name);
  }
  await b.close();
})();

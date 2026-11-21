// Which photo goes where. Drop files in assets/photos/ named after `files`
// (any of .jpg .jpeg .png .webp). The first file found in `files` wins, so a
// slot can fall back to a more generic photo (e.g. a brand photo for a hero slide).
//
// path syntax: field.sub, list[0], sections[block_uid] (first block of that type),
// sections[block_uid#1] (second block of that type).
module.exports = [
  // ── The Vak (group) ────────────────────────────────────────────
  { site: "GROUP", ct: "page", url: "/", path: "sections[hero_carousel].slides[0].image", files: ["the-vak-hero"], priority: 1 },
  { site: "GROUP", ct: "page", url: "/", path: "sections[hero_carousel].slides[1].image", files: ["surf-hero-1", "brand-surf"], priority: 2 },
  { site: "GROUP", ct: "page", url: "/", path: "sections[hero_carousel].slides[2].image", files: ["snow-hero-1", "brand-snow"], priority: 2 },
  { site: "GROUP", ct: "page", url: "/", path: "sections[story_block].image", files: ["the-vak-story"], priority: 2 },
  { site: "GROUP", ct: "page", url: "/about", path: "sections[story_block#0].image", files: ["the-vak-story"], priority: 2 },
  { site: "GROUP", ct: "page", url: "/about", path: "sections[story_block#1].image", files: ["the-vak-repair"], priority: 3 },
  { site: "GROUP", ct: "campaign", url: "/campaigns/cold-water-season", path: "hero_image", files: ["the-vak-campaign"], priority: 1 },
  { site: "GROUP", ct: "brand", url: "/brands/vak-surf", path: "hero_image", files: ["brand-surf"], priority: 1 },
  { site: "GROUP", ct: "brand", url: "/brands/vak-skate", path: "hero_image", files: ["brand-skate"], priority: 1 },
  { site: "GROUP", ct: "brand", url: "/brands/vak-snow", path: "hero_image", files: ["brand-snow"], priority: 1 },
  // ── Logos (assets/logo) ──
  { site: "GROUP", ct: "header", path: "logo", files: ["the-vak-wordmark"], priority: 1 },
  ...["surf", "skate", "snow"].map((b) => ({ site: "GROUP", ct: "brand", url: `/brands/vak-${b}`, path: "logo", files: ["the-vak-monogram"], priority: 1 })),
  ...["SURF", "SKATE", "SNOW"].flatMap((site) => [
    { site, ct: "header", path: "logo", files: ["the-vak-monogram"], priority: 1 },
    { site, ct: "brand", url: "/about", path: "logo", files: ["the-vak-monogram"], priority: 1 },
  ]),
  ...["surf", "skate", "snow"].map((b, i) => ({
    site: "GROUP", ct: "page", url: "/", path: `sections[universe_tiles].tiles[${i}].image`, files: [`tile-${b}`, `brand-${b}`], priority: 1,
  })),
  ...["amsterdam", "biarritz", "nice", "milano", "barcelona"].map((city) => ({
    site: "GROUP", ct: "store", url: `/stores/${city}`, path: "image", files: [`store-${city}`, "store-generic"], priority: 1,
  })),

  // ── Brand stacks ───────────────────────────────────────────────
  ...[
    ["SURF", "surf", ["wetsuits", "boardshorts"], "/campaigns/winter-swell-drop", "/guides/choose-a-winter-wetsuit"],
    ["SKATE", "skate", ["sneakers", "streetwear"], "/campaigns/concrete-season", "/guides/make-your-skate-shoes-last"],
    ["SNOW", "snow", ["jackets", "goggles"], "/campaigns/first-tracks", "/guides/goggle-lens-for-flat-light"],
  ].flatMap(([site, b, cats, campaign, guide]) => [
    { site, ct: "brand", url: "/about", path: "hero_image", files: [`brand-${b}`], priority: 1 },
    { site, ct: "page", url: "/", path: "sections[hero_carousel].slides[0].image", files: [`${b}-hero-1`, `brand-${b}`], priority: 1 },
    { site, ct: "page", url: "/", path: "sections[hero_carousel].slides[1].image", files: [`${b}-hero-2`, `${b}-hero-1`, `brand-${b}`], priority: 2 },
    { site, ct: "page", url: "/", path: "sections[story_block].image", files: [`${b}-story`], priority: 3 },
    ...cats.map((c) => ({ site, ct: "category", url: `/${c}`, path: "image", files: [`category-${c}`], priority: 1 })),
    { site, ct: "campaign", url: campaign, path: "hero_image", files: [`${b}-campaign`], priority: 1 },
    { site, ct: "article", url: guide, path: "cover_image", files: [`${b}-guide`], priority: 2 },
  ]),

  // ── Product galleries: one target per colourway that has photos (multi = all files, in order) ──
  ...[
    ["SURF", "/products/noordzee-5-4-hooded-wetsuit", [["product-vs-ws-001-1"]]],
    ["SURF", "/products/zandvoort-3-2-womens-wetsuit", [["product-vs-ws-002-1"]]],
    ["SURF", "/products/golfslag-18-boardshort", [["product-vs-bs-001-1"]]],
    ["SURF", "/products/duin-womens-boardshort", [["product-vs-bs-002-1"]]],
    ["SKATE", "/products/brug-low-suede-sneaker", [["product-vk-sn-001-1"]]],
    ["SKATE", "/products/noord-mid-canvas-sneaker", [["product-vk-sn-002-1"]]],
    ["SKATE", "/products/kade-heavyweight-hoodie", [["product-vk-st-001-1", "product-vk-st-001-3"], ["product-vk-st-001-2"]]],
    ["SKATE", "/products/werf-work-pant", [["product-vk-st-002-1"], ["product-vk-st-002-2"]]],
    ["SKATE", "/products/pier-heavyweight-tee", [["product-vk-st-003-1", "product-vk-st-003-2"]]],
    ["SNOW", "/products/polder-3l-shell-jacket", [["product-vn-jk-001-1", "product-vn-jk-001-2"]]],
    ["SNOW", "/products/ijs-womens-insulated-jacket", [["product-vn-jk-002-1"]]],
    ["SNOW", "/products/mist-cylindrical-goggle", [["product-vn-gg-001-1"], ["product-vn-gg-001-2"]]],
    ["SNOW", "/products/helder-spherical-goggle", [["product-vn-gg-002-1"]]],
  ].flatMap(([site, url, perColourway]) =>
    perColourway.map((files, i) => ({ site, ct: "product", url, path: `colourways[${i}].images`, multi: true, priority: 1, files })),
  ),
];

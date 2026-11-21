# Site factory: stacks and seed content

| Stack | Role | Region | Status |
|---|---|---|---|
| The Vak | Group site + factory model reference | AWS NA | Model + group content seeded (en-us), published to `development` |
| Vak Surf | Brand site | AWS NA | Brand content seeded (en-us), published to `development` — MCP server `contentstack-surf` |
| Vak Skate | Brand site | AWS NA | Brand content seeded (en-us), published to `development` — MCP server `contentstack-skate` |
| Vak Snow | Brand site | AWS NA | Brand content seeded (en-us), published to `development` — MCP server `contentstack-snow` |

All four stacks share the **same factory model**: global fields `seo` and `cta`; taxonomies `activity`, `gender`, `market`; content types `brand`, `category`, `product`, `campaign`, `store`, `article`, `page`, `header`, `footer`. Each stack only uses the parts it needs.

API keys live in `.env.local` (`VAK_GROUP_API_KEY`, `VAK_SURF_API_KEY`, `VAK_SKATE_API_KEY`, `VAK_SNOW_API_KEY`) and `.mcp.json`, both git-ignored.

Replication plan: the **structure** (locales, environment, taxonomies, global fields, content types, workflow) is cloned from The Vak with the Contentstack CLI (`cm:stacks:clone --type a`); the **brand content** is seeded per stack through MCP.

Done on 2026-11-20 for Surf, Skate and Snow: locales, `development` environment, taxonomies (with terms), global fields, 9 content types (taxonomy fields verified), workflow `Review`. **Not copied:** the publish rule (re-create it in the UI where guides are published). See FRICTION_LOG row 17 for the CLI workaround.

## The Vak (group) — seed entries (en-us)

| Content type | Entry | UID |
|---|---|---|
| brand | Vak Surf (#00A8B5) | bltd072b700c867cb33 |
| brand | Vak Skate (#FF5A1F) | bltaf8f6c443709b5cf |
| brand | Vak Snow (#3D5AFE) | blt57cd79a0246b99a2 |
| store | Amsterdam – Flagship (nl) | blt14dda0dddc0394e9 |
| store | Biarritz – Surf House (fr) | bltda7ea3dd7df6c204 |
| store | Nice – Riviera Shop (fr) | blta5707a4d597c71df |
| store | Milano – Snow & Street (it) | blta1fddaa08d441d93 |
| store | Barcelona – Skate Yard (es) | blt06a1daac603cb1cc |
| campaign | Cold Water Season (all markets) | bltfb31afc9c7a764d7 |
| page | Home `/` | blt3402a8e8b9cb6f1d |
| page | About `/about` | blt0356b2c3ba8b2a1b |
| page | Stores `/stores` | blted5654e839e8d659 |
| header | The Vak header | blt372b6466a86b58b1 |
| footer | The Vak footer | bltb46e00d9ce186159 |

Locales: `en-us` (master), `fr-fr`, `it-it`, `es-es` (fallback `en-us`). Workflow `Review` on `article` + publish rule (stage Approved, env development).

Environment: `development` (uid blt2ec4a4f8c1255d5f), base URL `http://localhost:3000/`.

## Brand stacks — seed entries (en-us)

Seeded on 2026-11-20 through MCP, 15 entries per stack, all published to `development` (en-us). Same shape in every brand stack, so one front end can render any of them: 1 `brand` (the site's own identity, `url: /about`), 2 `category`, 4 `product`, 1 `campaign`, 1 `article` (guide), 1 `page` home `/` (hero_carousel → category_tiles → product_carousel → campaign_banner → story_block), 1 `header`, 1 `footer`. Photos: free-licence Unsplash images (see `assets/photos/CREDITS.md`), uploaded and linked by `scripts/upload-photos.cjs` (MCP has no asset upload, FRICTION_LOG row 14). Product colourways (name + swatch) match their photos; Ijs jacket and Helder goggle have no photo yet.

| Content type | Vak Surf | Vak Skate | Vak Snow |
|---|---|---|---|
| brand | Vak Surf `bltef4d5e21e54609a9` | Vak Skate `blt126a45ab186ad5d9` | Vak Snow `blt78962e0bac3e043a` |
| category | Wetsuits `blt5f164138af9784be` | Sneakers `blt9b155d11ff3b6fed` | Jackets `bltef2a2a9ddfe96dd5` |
| category | Boardshorts `blt83befb7aaccd21dd` | Streetwear `blt02e693ca70e6fc7e` | Goggles `blt87bfd03f8bf816e3` |
| product | VS-WS-001 Noordzee 5/4 `blt7f90178fbd387952` | VK-SN-001 Brug Low `blta9b18df9209e2559` | VN-JK-001 Polder 3L `blt5bcb1a65355fed4e` |
| product | VS-WS-002 Zandvoort 3/2 `blt138ccae7e4e3b9fe` | VK-SN-002 Noord Mid `blt722df2574abf9561` | VN-JK-002 Ijs Insulated `blt26d34241a022338e` |
| product | VS-BS-001 Golfslag 18" `blt872c9efb9472165f` | VK-ST-001 Kade Hoodie `blt52d0e7bbc783637e` | VN-GG-001 Mist Goggle `blt6ac027b9e2f3788c` |
| product | VS-BS-002 Duin `blt3cf7c397a38e2cb4` | VK-ST-002 Werf Pant `blt524442b571d54424` | VN-GG-002 Helder Goggle `bltdf91ac893a179c52` |
| product | — | VK-ST-003 Pier Heavyweight Tee `blt56557bba211518a1` | — |
| campaign | Winter Swell Drop `blt5bfb165743f821e8` | Concrete Season `blt6ff7bff7bba9345f` | First Tracks `blt5591a4216559d307` |
| article | Choose a winter wetsuit `blt5fef9bdc92b09db3` | Make your skate shoes last `blte20803dfcc111efe` | Goggle lens for flat light `bltc884bd668e831087` |
| page | Home `/` `bltec85bf060d57c2f8` | Home `/` `bltd4c6651ebde86094` | Home `/` `blt00c6c7414ceb3ba3` |
| header | `blt86765847806b1dff` | `blt78b82f03a6d3a8ae` | `blt8199b72dfb4a14da` |
| footer | `blt674b0668d3a9a327` | `blta692601b2ad4ca57` | `blt2c6eb8844b67dec3` |

`development` environment UIDs: Surf `blt2a5537834d019f08`, Skate `blt30a90329403480d4`, Snow `bltd9d8622f943ca46d`.

**To do:** the brand stacks have the `Review` workflow but no publish rule, so the guides went live while still in the *Draft* stage. Re-create the publish rule (stage Approved, env development) in each brand stack's UI.

Brand site URLs (`*.thevak.example`) are placeholders until the Launch projects exist (Step 5).

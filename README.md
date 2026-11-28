# The Vak – Boardsports Collective · Contentstack demo

Original demo site for a fictional boardsports group born in Amsterdam, built on a Contentstack trial for a Partner Engineer (EMEA) interview panel. Three house brands: **Vak Surf** (wetsuits, boardshorts), **Vak Skate** (sneakers, streetwear) and **Vak Snow** (jackets, goggles). Markets: Netherlands, France, Italy, Spain.

All copy is original. Images are royalty-free Unsplash photos, plus Boardriders Europe photos (Quiksilver, Roxy, Billabong, DC, Element) used with permission for this demo only. Sources in `assets/photos/CREDITS.md`.

> Status: **Live on Launch** — [The Vak](https://the-vak.contentstackapps.com) · [Vak Surf](https://vak-surf.contentstackapps.com) · [Vak Skate](https://vak-skate.contentstackapps.com) · [Vak Snow](https://vak-snow.contentstackapps.com), in en/fr/it/es, with Personalize on the group site (try `?affinity=snow`), Live Preview / Visual Builder, Brand Kit and an AI translation (Polaris) approved through the Review workflow.

## Architecture

- **CMS**: Contentstack stack "The Vak" (AWS North America). Locales `en-us` (master), `fr-fr`, `it-it`, `es-es`. Environment `development`.
- **Markets vs locales**: market (`nl`, `fr`, `it`, `es`) is a taxonomy, not a locale. The NL market is served in English.
- **MCP**: content model and seed content are created through the Contentstack MCP server (`@contentstack/mcp`, groups `cma,cma-extended`).
- **Front end**: Next.js (App Router, TypeScript) with the Contentstack Delivery SDK, using the Delivery token only.
- **Live Preview / Visual Builder**: edit tags are generated in the data layer with `addEditableTags`. Preview requests are never cached.
- **Personalize**: home page entry variants. Only the hero changes, based on a `surf` / `skate` affinity attribute.
- **AI**: Brand Kit (voice of The Vak and its three brands), Polaris and Agent OS (Automate, Custom Agent) for a localised guide that a human reviews before publishing.
- **Hosting**: Contentstack Launch. Cache-Control headers (`s-maxage` + `stale-while-revalidate`), with a publish webhook that triggers "Revalidate CDN Cache".

## Content model

### Global fields
- `seo`: meta_title, meta_description, og_image, canonical_url, no_index
- `cta`: label, link, style

### Taxonomies
- `activity`: surf, skate, snow
- `gender`: women, men, kids, unisex
- `market`: nl, fr, it, es

### Content types
| UID | Purpose |
|---|---|
| `page` | Home, brand and about pages. `sections` modular blocks: `hero_carousel`, `universe_tiles`, `product_carousel`, `campaign_banner`, `category_tiles`, `brand_grid`, `story_block`. `theme_brand` sets the accent colour. |
| `product` | SKU, brand, category, gender, activity, price label, colourways with images, sizes, features, composition, related products |
| `brand` | Logo, accent colour (hex), tagline, story, hero image |
| `category` | Self-referencing parent, activity, gender |
| `campaign` | Dates, headline, hero, products, target market |
| `store` | City, address, coordinates, opening hours, market |
| `article` | Guides and stories (JSON RTE with embedded products) |
| `header` / `footer` | Singletons: mega menu by gender then activity, footer columns |

Conventions: `url` is unique and not localisable (the front end adds the locale prefix). SKUs, images and colours are not localisable.

Editorial workflow **Review** (Draft → AI draft → In review → Approved), plus a publish rule that requires "Approved".

## Running locally

### Site factory

One Next.js codebase, four sites. `SITE` (`group`, `surf`, `skate`, `snow`) picks the stack; everything else (brand colour, navigation, pages) comes from that stack's content. In Launch this means one project per site, same repo, different environment variables.

```
src/lib/site.ts          site factory config: SITE → stack credentials, placeholder-domain mapping
src/lib/contentstack.ts  data layer (Delivery SDK, Live Preview, edit tags) — the only file that calls Contentstack
src/lib/routes.tsx       URL → content resolution and the page views
src/components/          SiteShell (header/footer/theme), modular-block sections, UI
src/proxy.ts             locale prefixes + routing of Live Preview requests
```

- **URLs**: English has no prefix (`/about`), other languages do (`/fr/about`). `/products/*`, `/guides/*`, `/campaigns/*` have their own types; other paths resolve to a page, then a category, then the brand entry. `/women/wetsuits` filters a category by the `gender` taxonomy.
- **Cross-site links** are stored in content as `https://surf.thevak.example/...` and mapped to each environment's real URLs (`NEXT_PUBLIC_*_URL`), so editors never paste environment-specific links.
- **Caching**: public pages use ISR (`revalidate = 60`) → `Cache-Control: s-maxage=60, stale-while-revalidate`. Requests with `?live_preview=` are rewritten by the proxy to `/preview/...`, a dynamic route served with `no-store` that reads the Preview API. An expired preview hash falls back to published content.
- **Visual Builder**: edit tags are added in the data layer (`addEditableTags`) only for preview requests; the Live Preview SDK only starts inside the CMS iframe.
- **Studio** (group site): five Vak components are registered with `@contentstack/studio-react` (`src/studio/components.tsx`); a Studio template connected to the `landing_page` content type renders every landing page at its entry URL (`/lp/first-snow`). The proxy sends `/lp/...` to `src/app/studio/`, which keeps the site header and footer; `/studio-canvas` is the project's Canvas URL.
- **Block previews**: each of the 8 Page blocks has a preview image (a screenshot of the live block, `assets/block-previews/`) and a category (Heroes and campaigns / Products and categories / Brand and stores), so editors add blocks from a visual menu in the entry editor and Visual Builder. `scripts/shoot-block-previews.cjs` takes the screenshots with Playwright; `scripts/block-previews.cjs` uploads them and sets `preview_img` and `categories` in all four stacks.
- **Images**: Unsplash and Boardriders Europe photos (credits in `assets/photos/CREDITS.md`) uploaded and linked by `scripts/upload-photos.cjs`; SVGs are served as-is, raster images through the Image Delivery API (`width`, `auto=webp`).

### Personalize (group site)

Personalize project linked to The Vak, custom attribute `affinity`, audiences Surf riders / Skaters / Snow riders, segmented experience "Home hero by affinity" (variants Surf `0_0`, Skate `0_1`, Snow `0_2`) on the `page` content type. Each variant of the Home entry puts its brand's slide first.

- `?affinity=surf|skate|snow` sets the attribute (e.g. from an ad or a newsletter link); Personalize remembers it for the next visits through its cookies.
- `src/proxy.ts` initialises the Edge SDK per request and rewrites to `/<lang>/__v/<variantParam>/...`, so ISR caches one copy per variant. If Personalize is down, the default content is served.
- The data layer sends the variant aliases to the CDA (`x-cs-variant-uid`) for `page` only; the browser reports impressions.
- Enabled per site with `VAK_<SITE>_PERSONALIZE_PROJECT_UID` (only the group site has one).
- **Behavioral**: the audiences also follow what the visitor does. On the group site, `AffinityTracker` counts visits of each brand page (`/brands/vak-snow` → custom attribute `snow_views`, a number); "Snow riders" = `affinity` is snow OR `snow_views` > 1, so the second visit puts the Snow slide first. A click through to a brand site (tiles, hero CTAs, brand cards, mega menu) sets `affinity` at once. (The engagement score would come from Lytics in production; Lytics' default audiences already show up in Personalize once the projects are connected.) Links from a brand site back to the group carry `?affinity=<brand>`, so coming back from Vak Snow puts the Snow slide first.
- **Geographic**: audiences "Visitors in Netherlands / France / Italy / Spain" (Country = NL/FR/IT/ES, or `?market=nl|fr|it|es` to demo another country without a VPN) drive the experience "Local announcement by country", linked to the `header` content type: the announcement bar points to the nearest store, on every page and in every language. The France case was built by hand in the UI; the other three, and the 16 header variants, by `scripts/personalize-geo.cjs` (Personalize Management API + CMA, idempotent).

### AI with human review

- Brand Kit "The Vak": voice profiles The Vak / Vak Surf / Vak Skate / Vak Snow and Knowledge Vault entries (brand facts, product catalogue, translation rules). Source text in `contentstack/BRAND_KIT.md`.
- Demo: the Vak Surf guide "How to choose a winter wetsuit" was localized to fr-fr and translated by Polaris with the Vak Surf voice profile, then moved Draft → AI draft → In review → Approved. A publish rule in Vak Surf (Article, development, all locales) blocks publishing until the Approved stage.
- Live at `/fr/guides/choose-a-winter-wetsuit` on the Surf site.

### Translations (fr-fr, it-it, es-es)

- All brand, category, product, campaign, store, page, header and footer entries are localized in the three languages (144 versions), plus the 9 Personalize variants of the group Home page. Guides stay in the CMS flow (Polaris + Review workflow).
- Source of truth: `contentstack/i18n/build_translations.py` (English → fr/it/es, following the Brand Kit: informal address, brand/product/store/campaign names kept in English). `node scripts/translate-content.cjs extract|apply` re-extracts the strings and re-applies/publishes; `scripts/translate-variants.cjs` does the variants.
- UI labels and store opening days are translated in the front end (`src/lib/i18n.ts`).

### Demo

- `docs/DEMO_SCRIPT_SHORT.md`: the demo on one page. `docs/DEMO_SCRIPT.md`: the full script (clicks, talking points, fallbacks, likely questions). `docs/AI_SHOWCASE.md`: Polaris prompts and the on-demand agents.
- `node scripts/demo-reset.cjs` puts the Vak Snow demo content back in its starting state (home carousel "Best sellers", the Polaris guide *Layering for a cold front* as an unpublished draft). `--dry-run` shows what would change.
- **Agent OS**: *Vak Demand agent* (on-demand trigger with inputs *Trend signal* and *Headline*; tools Get Single Entry + Update an Entry on Vak Snow, running as the user; no publish tool) reorders the Vak Snow home "Best sellers" carousel from a trend signal and leaves a draft for review. Run it from Agent OS or from Polaris (`@vak_demand_agent`).
- **Agent OS**: *Vak Campaign Builder*, generated by Polaris from a one-paragraph description (New Agent → "What do you want your agent to do?"): on-demand input *Campaign brief*; tools Get All Content Types, Get All Entries by Content Type, Create an Entry, Brand Kit Get All Voice Profiles, Get All Terms across All Taxonomies (Vak Snow, running as the user; no publish tool). It creates a complete draft Campaign entry (dates, voice, products, CTA, SEO, markets) for review.
- **Editorial content**: `contentstack/articles.cjs` (8 guides and stories, 4 languages, Brand Kit voices) seeded by `node scripts/seed-articles.cjs` (covers, localized versions, Approved stage, publish per locale).

### Run

```bash
npm install
cp .env.example .env.local   # then fill in the VAK_<SITE>_* keys and tokens
npm run dev:group            # http://localhost:3000
npm run dev:surf             # http://localhost:3001
npm run dev:skate            # http://localhost:3002
npm run dev:snow             # http://localhost:3003
```

Each dev server uses its own build folder (`.next-<site>`), so all four can run at once. Tokens: one Delivery token per stack (`vak-site-development`, environment `development`, read-only) with its Preview token.

## Deploying on Launch

Same repo, four Launch projects (one per site), each built with its own environment variables.

| Project | `SITE` | Stack | URL |
|---|---|---|---|
| the-vak | `group` | The Vak (+ Personalize) | https://the-vak.contentstackapps.com |
| vak-surf | `surf` | Vak Surf | https://vak-surf.contentstackapps.com |
| vak-skate | `skate` | Vak Skate | https://vak-skate.contentstackapps.com |
| vak-snow | `snow` | Vak Snow | https://vak-snow.contentstackapps.com |

- Framework preset **Next.js**, build `npm run build`, output `.next`, Node 22.
- `node scripts/launch-env.cjs` writes `.env.launch.<site>` (git-ignored) to paste with *Add in bulk*. Once the four URLs are known: `node scripts/launch-env.cjs group=https://… surf=https://… skate=https://… snow=https://…`, update the variables and redeploy (`NEXT_PUBLIC_*` are inlined at build time).
- Each stack's `development` environment has one base URL per locale on its Launch domain (`/fr`, `/it`, `/es`), used by Live Preview / Visual Builder.
- On publish, a webhook / automation calls Launch's *Revalidate CDN cache* so editors don't wait for the 60 s ISR window.

## Security

- The front end only uses the Delivery token, plus the Preview token for Live Preview. The Management token is never exposed.
- Secrets live in `.env.local`. `.env*` and `.mcp.json` are git-ignored.

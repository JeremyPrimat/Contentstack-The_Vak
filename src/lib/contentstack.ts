/**
 * Data layer: the only place that talks to Contentstack.
 *
 * - Delivery token only (plus the Preview token for Live Preview). No Management token.
 * - A new SDK stack per request: livePreviewQuery() mutates the stack, so a shared
 *   instance would leak one editor's preview hash into another request.
 * - Edit tags (data-cslp) are added here, and only for Live Preview requests.
 */
import contentstack, { QueryOperation, type LivePreviewQuery } from "@contentstack/delivery-sdk";
import { addEditableTags, getContentstackEndpoint } from "@contentstack/utils";
import { LOCALE_BY_LANG, type Lang } from "./i18n";
import { getSite } from "./site";
import type { Article, Brand, Campaign, Category, EntryBase, Footer, Header, Page, Product } from "./types";

export type PreviewParams = {
  live_preview?: string;
  content_type_uid?: string;
  entry_uid?: string;
  preview_timestamp?: string;
};

type Ctx = {
  stack: ReturnType<typeof contentstack.stack>;
  locale: string;
  editable: boolean;
  /** Personalize variant aliases (e.g. cs_personalize_0_1) for content types that have variants. */
  variantAliases: string[];
};

function host(region: string, service: "preview" | "application"): string {
  return String(getContentstackEndpoint(region, service, true));
}

export function livePreviewSettings() {
  const { stack } = getSite();
  return {
    enabled: Boolean(stack.previewToken),
    apiKey: stack.apiKey,
    environment: stack.environment,
    appHost: host(stack.region, "application"),
  };
}

function createCtx(lang: Lang, preview?: PreviewParams | null, variantAliases: string[] = []): Ctx {
  const { stack: cfg } = getSite();
  const isPreview = Boolean(preview?.live_preview && cfg.previewToken);
  const stack = contentstack.stack({
    apiKey: cfg.apiKey,
    deliveryToken: cfg.deliveryToken,
    environment: cfg.environment,
    region: cfg.region,
    live_preview: {
      enable: isPreview,
      preview_token: cfg.previewToken,
      host: host(cfg.region, "preview"),
    },
  });
  if (isPreview && preview?.live_preview) {
    const query: LivePreviewQuery = {
      live_preview: preview.live_preview,
      contentTypeUid: preview.content_type_uid,
      entryUid: preview.entry_uid,
      preview_timestamp: preview.preview_timestamp,
    };
    stack.livePreviewQuery(query);
  }
  return { stack, locale: LOCALE_BY_LANG[lang], editable: isPreview, variantAliases };
}

function tag<T extends EntryBase>(ctx: Ctx, contentType: string, entry: T | undefined): T | undefined {
  if (entry && ctx.editable) {
    // Use the entry's own locale: with fallback, a fr-fr request can return an en-us entry.
    addEditableTags(entry as never, contentType, true, entry.locale ?? ctx.locale);
  }
  return entry;
}

async function findMany<T extends EntryBase>(
  ctx: Ctx,
  contentType: string,
  refs: string[] = [],
  where?: [field: string, value: string],
  personalized = false,
): Promise<T[]> {
  let entries = ctx.stack.contentType(contentType).entry().locale(ctx.locale).includeFallback();
  if (refs.length) entries = entries.includeReference(...refs);
  // Personalize: ask the CDA for the visitor's variant (falls back to the base entry when none applies).
  if (personalized && ctx.variantAliases.length) entries = entries.variants(ctx.variantAliases);
  const query = entries.query();
  if (where) query.where(where[0], QueryOperation.EQUALS, where[1]);
  const res = await query.find<T>();
  const list = (res.entries ?? []) as T[];
  return list.map((e) => tag(ctx, contentType, e) as T);
}

async function findOne<T extends EntryBase>(ctx: Ctx, contentType: string, field: string, value: string, refs: string[] = [], personalized = false) {
  const [entry] = await findMany<T>(ctx, contentType, refs, [field, value], personalized);
  return entry;
}

const PAGE_REFS = [
  "theme_brand",
  "sections.universe_tiles.tiles.brand",
  "sections.product_carousel.products",
  "sections.campaign_banner.campaign",
  "sections.category_tiles.categories",
  "sections.brand_grid.brands",
  "sections.store_list.stores",
];

/** Everything a route needs, bound to one language and one (optional) preview session. */
export function cms(lang: Lang, preview?: PreviewParams | null, variantAliases: string[] = []) {
  const ctx = createCtx(lang, preview, variantAliases);
  return {
    isPreview: ctx.editable,
    page: (url: string) => findOne<Page>(ctx, "page", "url", url, PAGE_REFS, true),
    header: async () => (await findMany<Header>(ctx, "header"))[0],
    footer: async () => (await findMany<Footer>(ctx, "footer"))[0],
    brands: () => findMany<Brand>(ctx, "brand"),
    brandByUrl: (url: string) => findOne<Brand>(ctx, "brand", "url", url),
    category: (url: string) => findOne<Category>(ctx, "category", "url", url),
    categories: () => findMany<Category>(ctx, "category"),
    product: (url: string) =>
      findOne<Product>(ctx, "product", "url", url, ["brand", "category", "related_products"]),
    products: () => findMany<Product>(ctx, "product", ["category"]),
    campaign: (url: string) => findOne<Campaign>(ctx, "campaign", "url", url, ["brand", "products"]),
    article: (url: string) => findOne<Article>(ctx, "article", "url", url, ["related_products"]),
    articles: () => findMany<Article>(ctx, "article"),
  };
}

export type Cms = ReturnType<typeof cms>;

/** Personalize variant param ("0_1,2_0") → CDA variant aliases. Anything unexpected is ignored. */
export function variantParamToAliases(param?: string): string[] {
  if (!param || !/^[A-Za-z0-9_,]+$/.test(param)) return [];
  return param.split(",").filter(Boolean).map((v) => `cs_personalize_${v}`);
}

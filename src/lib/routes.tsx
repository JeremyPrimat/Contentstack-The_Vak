import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { LivePreview } from "@/components/LivePreview";
import { AffinityTracker } from "@/components/AffinityTracker";
import { PersonalizeImpressions } from "@/components/PersonalizeImpressions";
import { Sections } from "@/components/sections/Sections";
import { SiteShell } from "@/components/SiteShell";
import { CtaButton, Media, ProductCard, SmartLink } from "@/components/ui";
import { cms, livePreviewSettings, variantParamToAliases, type PreviewParams } from "./contentstack";
import { LANGS, localizeHref, t, type Lang } from "./i18n";
import { Rte, rteToText } from "./rte";
import { getSite, personalizeProjectUid } from "./site";
import type { Article, Brand, Campaign, Category, Page, Product, Seo } from "./types";

const GENDERS = ["women", "men", "kids"] as const;
type Gender = (typeof GENDERS)[number];
const isGender = (s: string): s is Gender => (GENDERS as readonly string[]).includes(s);

type Resolved =
  | { kind: "page"; page: Page }
  | { kind: "product"; product: Product }
  | { kind: "article"; article: Article }
  | { kind: "articles"; articles: Article[] }
  | { kind: "campaign"; campaign: Campaign }
  | { kind: "listing"; title: string; description?: string; category?: Category; products: Product[]; gender?: Gender }
  | { kind: "brand"; brand: Brand };

const hasTerm = (e: { taxonomies?: { taxonomy_uid: string; term_uid: string }[] }, tax: string, term: string) =>
  (e.taxonomies ?? []).some((t) => t.taxonomy_uid === tax && t.term_uid === term);

/**
 * URL → content. Products, guides and campaigns have their own prefixes; anything else
 * is looked up as a page, then a category, then the brand entry (brand sites' /about).
 * `/{gender}` and `/{gender}/{category}` are listings filtered by the `gender` taxonomy.
 */
async function resolveWith(lang: Lang, slug: string[], preview: PreviewParams | null, variant = ""): Promise<Resolved | null> {
  const api = cms(lang, preview, variantParamToAliases(variant));
  const url = "/" + slug.join("/");
  const [first, second] = slug;

  if (slug.length === 0) {
    const page = await api.page("/");
    return page ? { kind: "page", page } : null;
  }
  if (first === "products" && second) {
    const product = await api.product(url);
    return product ? { kind: "product", product } : null;
  }
  if (first === "guides") {
    if (!second) return { kind: "articles", articles: await api.articles() };
    const article = await api.article(url);
    return article ? { kind: "article", article } : null;
  }
  if (first === "campaigns" && second) {
    const campaign = await api.campaign(url);
    return campaign ? { kind: "campaign", campaign } : null;
  }
  if (isGender(first) && slug.length <= 2) {
    const products = (await api.products()).filter((p) => hasTerm(p, "gender", first) || hasTerm(p, "gender", "unisex"));
    if (!second) return { kind: "listing", title: first, products, gender: first };
    const category = await api.category("/" + second);
    if (!category) return null;
    return {
      kind: "listing",
      title: category.title,
      description: category.description,
      category,
      gender: first,
      products: products.filter((p) => p.category?.[0]?.uid === category.uid),
    };
  }

  const page = await api.page(url);
  if (page) return { kind: "page", page };
  if (slug.length === 1) {
    const category = await api.category(url);
    if (category) {
      const products = (await api.products()).filter((p) => p.category?.[0]?.uid === category.uid);
      return { kind: "listing", title: category.title, description: category.description, category, products };
    }
  }
  // Brand entries: /about on a brand site, /brands/vak-snow on the group site.
  const brand = await api.brandByUrl(url);
  if (brand) return { kind: "brand", brand };
  return null;
}

/**
 * A preview hash expires (or is opened outside the CMS): fall back to published
 * content instead of failing the page.
 */
async function withPreviewFallback<T>(previewKey: string, load: (preview: PreviewParams | null) => Promise<T>): Promise<T> {
  if (!previewKey) return load(null);
  try {
    return await load(JSON.parse(previewKey) as PreviewParams);
  } catch (error) {
    console.warn("[live-preview] preview request failed, serving published content:", (error as Error).message);
    return load(null);
  }
}

// Metadata and page render share one lookup per request.
const resolve = cache((lang: Lang, slug: string[], previewKey: string, variant = "") =>
  withPreviewFallback(previewKey, (preview) => resolveWith(lang, slug, preview, variant)),
);

// The header is personalized too (announcement by country), so the chrome depends on the variant.
const loadChrome = cache((lang: Lang, previewKey: string, variant = "") =>
  withPreviewFallback(previewKey, (preview) => loadChromeWith(lang, preview, variant)),
);

async function loadChromeWith(lang: Lang, preview: PreviewParams | null, variant = "") {
  const api = cms(lang, preview, variantParamToAliases(variant));
  const site = getSite();
  const [header, footer, brands] = await Promise.all([api.header(), api.footer(), site.isGroup ? Promise.resolve([]) : api.brands()]);
  return { header, footer, siteBrand: brands[0] };
}

function previewKeyOf(preview?: PreviewParams | null) {
  return preview?.live_preview ? JSON.stringify(preview) : "";
}

function seoMetadata(seo: Seo | undefined, fallbackTitle: string, fallbackDescription?: string): Metadata {
  return {
    title: seo?.meta_title || fallbackTitle,
    description: seo?.meta_description || fallbackDescription,
    robots: seo?.no_index ? { index: false } : undefined,
    alternates: seo?.canonical_url ? { canonical: seo.canonical_url } : undefined,
  };
}

export async function routeMetadata(lang: Lang, slug: string[], preview?: PreviewParams | null, variant = ""): Promise<Metadata> {
  const site = getSite();
  const r = await resolve(lang, slug, previewKeyOf(preview), variant);
  const path = "/" + slug.join("/");
  const languages = Object.fromEntries(LANGS.map((l) => [l, localizeHref(path, l)]));
  const base: Metadata = { alternates: { languages } };
  if (!r) return { ...base, title: site.name };
  switch (r.kind) {
    case "page":
      return { ...base, ...seoMetadata(r.page.seo, `${r.page.title} | ${site.name}`) };
    case "product":
      return { ...base, ...seoMetadata(r.product.seo, `${r.product.title} | ${site.name}`, r.product.short_description) };
    case "article":
      return { ...base, ...seoMetadata(r.article.seo, `${r.article.title} | ${site.name}`, r.article.excerpt) };
    case "campaign":
      return { ...base, ...seoMetadata(r.campaign.seo, `${r.campaign.title} | ${site.name}`, r.campaign.summary) };
    case "brand":
      return { ...base, title: `About ${r.brand.title}`, description: r.brand.tagline ?? rteToText(r.brand.story) };
    case "articles":
      return { ...base, title: `${t(lang).guides} | ${site.name}` };
    case "listing":
      return { ...base, title: `${capitalize(r.title)} | ${site.name}`, description: r.description };
  }
}

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export async function RouteView({ lang, slug, preview, variant = "" }: { lang: Lang; slug: string[]; preview?: PreviewParams | null; variant?: string }) {
  const key = previewKeyOf(preview);
  const [r, chrome] = await Promise.all([resolve(lang, slug, key, variant), loadChrome(lang, key, variant)]);
  if (!r) notFound();
  const lp = livePreviewSettings();
  const themeBrand = (r.kind === "page" ? r.page.theme_brand?.[0] : undefined) ?? chrome.siteBrand;
  return (
    <SiteShell lang={lang} path={"/" + slug.join("/")} header={chrome.header} footer={chrome.footer} brand={themeBrand}>
      {lp.enabled ? <LivePreview apiKey={lp.apiKey} environment={lp.environment} appHost={lp.appHost} /> : null}
      {getSite().isGroup && personalizeProjectUid() ? <AffinityTracker projectUid={personalizeProjectUid()!} /> : null}
      {variant && personalizeProjectUid() ? (
        <PersonalizeImpressions projectUid={personalizeProjectUid()!} aliases={variantParamToAliases(variant)} />
      ) : null}
      <View r={r} lang={lang} />
    </SiteShell>
  );
}

function View({ r, lang }: { r: Resolved; lang: Lang }) {
  const ui = t(lang);
  switch (r.kind) {
    case "page":
      return <Sections sections={r.page.sections} lang={lang} />;

    case "product": {
      const p = r.product;
      return (
        <div className="container product">
          <div className="product-gallery">
            {/* Gallery = every image of every colourway, main view first. */}
            {(() => {
              const images = (p.colourways ?? []).flatMap((c) => c.images ?? []);
              return (
                <>
                  <Media asset={images[0]} label={p.sku} tone="soft" className="product-hero" cslp={p.colourways?.[0]?.$?.images} />
                  {images.length > 1 ? (
                    <div className="product-thumbs">
                      {images.slice(1).map((img) => (
                        <Media key={img.uid} asset={img} label={p.title} tone="soft" className="product-thumb" />
                      ))}
                    </div>
                  ) : null}
                </>
              );
            })()}
          </div>
          <div className="product-info">
            {p.category?.[0] ? (
              <SmartLink href={p.category[0].url} lang={lang} className="eyebrow">
                {p.category[0].title}
              </SmartLink>
            ) : null}
            <h1 {...p.$?.title}>{p.title}</h1>
            <p className="price large" {...p.$?.price_label}>{p.price_label}</p>
            {p.short_description ? <p className="lede" {...p.$?.short_description}>{p.short_description}</p> : null}
            <Rte doc={p.description} cslp={p.$?.description} />
            {p.colourways?.length ? (
              <div className="spec">
                <h2 className="h-small">{ui.colourways}</h2>
                <ul className="chips">
                  {p.colourways.map((c) => (
                    <li key={c.name} {...c.$?.name}>
                      <span className="swatch" style={{ background: c.swatch_hex ?? "#ccc" }} /> {c.name}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {p.sizes?.length ? (
              <div className="spec">
                <h2 className="h-small">{ui.sizes}</h2>
                <ul className="chips" {...p.$?.sizes}>
                  {p.sizes.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            {p.features?.length ? (
              <div className="spec">
                <h2 className="h-small">{ui.features}</h2>
                <ul className="features" {...p.$?.features}>
                  {p.features.map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            {p.composition ? (
              <p className="small muted" {...p.$?.composition}>
                {ui.composition}: {p.composition}
              </p>
            ) : null}
            <p className="small muted">SKU {p.sku}</p>
          </div>
          {p.related_products?.length ? (
            <section className="section product-related">
              <h2>{ui.related}</h2>
              <div className="rail">
                {p.related_products.map((rp) => (
                  <ProductCard key={rp.uid} product={rp} lang={lang} />
                ))}
              </div>
            </section>
          ) : null}
        </div>
      );
    }

    case "article": {
      const a = r.article;
      return (
        <article className="container article">
          <p className="eyebrow">
            {a.type} · {a.author} · {a.published_date}
          </p>
          <h1 {...a.$?.title}>{a.title}</h1>
          {a.excerpt ? <p className="lede" {...a.$?.excerpt}>{a.excerpt}</p> : null}
          <Media asset={a.cover_image} tone="soft" className="article-cover" cslp={a.$?.cover_image} />
          <Rte doc={a.body} className="article-body" cslp={a.$?.body} />
          {a.related_products?.length ? (
            <section className="section">
              <h2>{ui.related}</h2>
              <div className="rail">
                {a.related_products.map((rp) => (
                  <ProductCard key={rp.uid} product={rp} lang={lang} />
                ))}
              </div>
            </section>
          ) : null}
        </article>
      );
    }

    case "articles":
      return (
        <div className="container section">
          <h1>{ui.guides}</h1>
          {r.articles.length === 0 ? <p className="muted">{ui.empty}</p> : null}
          <div className="grid grid-2">
            {r.articles.map((a) => (
              <SmartLink key={a.uid} href={a.url} lang={lang} className="article-card">
                <p className="eyebrow">{a.type}</p>
                <h2 {...a.$?.title}>{a.title}</h2>
                <p className="muted" {...a.$?.excerpt}>{a.excerpt}</p>
              </SmartLink>
            ))}
          </div>
        </div>
      );

    case "campaign": {
      const c = r.campaign;
      return (
        <>
          <section className="campaign-banner layout-full">
            <div className="container campaign-inner">
              <div className="campaign-copy">
                {c.eyebrow ? <p className="eyebrow" {...c.$?.eyebrow}>{c.eyebrow}</p> : null}
                <h1 {...c.$?.headline}>{c.headline}</h1>
                {c.summary ? <p className="lede" {...c.$?.summary}>{c.summary}</p> : null}
                <CtaButton cta={c.cta} lang={lang} />
              </div>
              <Media asset={c.hero_image} label={c.title} tone="dark" className="campaign-media" cslp={c.$?.hero_image} />
            </div>
          </section>
          {c.products?.length ? (
            <section className="section container">
              <h2>{ui.inCampaign}</h2>
              <div className="rail">
                {c.products.map((p) => (
                  <ProductCard key={p.uid} product={p} lang={lang} />
                ))}
              </div>
            </section>
          ) : null}
        </>
      );
    }

    case "listing":
      return (
        <div className="container section">
          {r.gender && r.category ? <p className="eyebrow">{capitalize(r.gender)}</p> : null}
          <h1 {...r.category?.$?.title}>{capitalize(r.title)}</h1>
          {r.description ? <p className="lede narrow" {...r.category?.$?.description}>{r.description}</p> : null}
          {r.products.length === 0 ? (
            getSite().isGroup ? (
              <p className="muted">
                {ui.shopBrands}: <SmartLink href="https://surf.thevak.example" lang={lang}>Vak Surf</SmartLink> ·{" "}
                <SmartLink href="https://skate.thevak.example" lang={lang}>Vak Skate</SmartLink> ·{" "}
                <SmartLink href="https://snow.thevak.example" lang={lang}>Vak Snow</SmartLink>
              </p>
            ) : (
              <p className="muted">{ui.empty}</p>
            )
          ) : null}
          <div className="grid grid-4">
            {r.products.map((p) => (
              <ProductCard key={p.uid} product={p} lang={lang} />
            ))}
          </div>
        </div>
      );

    case "brand": {
      const b = r.brand;
      return (
        <div className="container section about">
          <p className="eyebrow">{b.title}</p>
          <h1 {...b.$?.tagline}>{b.tagline}</h1>
          <Media asset={b.hero_image} tone="accent" label={b.title} className="about-media" cslp={b.$?.hero_image} />
          <Rte doc={b.story} className="article-body" cslp={b.$?.story} />
        </div>
      );
    }
  }
}

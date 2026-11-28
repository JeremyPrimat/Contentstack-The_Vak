import { dayLabel, localizeHref, t, type Lang } from "@/lib/i18n";
import { Rte } from "@/lib/rte";
import { resolveSiteHref } from "@/lib/site";
import type { Section } from "@/lib/types";
import { CtaButton, Media, ProductCard, SmartLink } from "../ui";

type SectionData<K extends string> = Section extends infer S ? (S extends Record<K, infer V> ? V : never) : never;
type Props<K extends string> = { data: SectionData<K>; lang: Lang };

function HeroCarousel({ data, lang }: Props<"hero_carousel">) {
  const slides = data.slides ?? [];
  return (
    <section className="hero" {...data.$?.slides}>
      <div className="hero-track">
        {slides.map((s, i) => (
          <div key={i} className={`hero-slide activity-${s.activity ?? "all"}`} id={`slide-${i}`}>
            <Media asset={s.image} className="hero-media" tone="dark" cslp={s.$?.image} />
            <div className="hero-copy container">
              {s.eyebrow ? <p className="eyebrow" {...s.$?.eyebrow}>{s.eyebrow}</p> : null}
              <h1 {...s.$?.heading}>{s.heading}</h1>
              {s.subheading ? <p className="lede" {...s.$?.subheading}>{s.subheading}</p> : null}
              <CtaButton cta={s.cta} lang={lang} />
            </div>
          </div>
        ))}
      </div>
      {slides.length > 1 ? (
        <nav className="hero-dots container" aria-label="Slides">
          {slides.map((s, i) => (
            <a key={i} href={`#slide-${i}`} aria-label={s.heading} />
          ))}
        </nav>
      ) : null}
    </section>
  );
}

function UniverseTiles({ data, lang }: Props<"universe_tiles">) {
  return (
    <section className="section container">
      {data.heading ? <h2 {...data.$?.heading}>{data.heading}</h2> : null}
      <div className="grid grid-3">
        {(data.tiles ?? []).map((tile, i) => {
          const brand = tile.brand?.[0];
          return (
            <SmartLink key={i} href={tile.cta?.link?.href ?? brand?.site_url} lang={lang} className="universe-tile">
              <div className="universe-tile-inner" style={{ ["--tile" as string]: brand?.accent_color ?? "var(--accent)" }}>
                {tile.image?.url ? <Media asset={tile.image} className="universe-media" cslp={tile.$?.image} /> : null}
                <span className="universe-label" {...tile.$?.label}>{tile.label}</span>
                {brand ? <span className="universe-brand">{brand.title}</span> : null}
                {brand?.tagline ? <span className="universe-tagline">{brand.tagline}</span> : null}
              </div>
            </SmartLink>
          );
        })}
      </div>
    </section>
  );
}

function ProductCarousel({ data, lang }: Props<"product_carousel">) {
  return (
    <section className="section container">
      <div className="section-head">
        {data.heading ? <h2 {...data.$?.heading}>{data.heading}</h2> : null}
        <CtaButton cta={data.cta} lang={lang} />
      </div>
      <div className="rail" {...data.$?.products}>
        {(data.products ?? []).map((p) => (
          <ProductCard key={p.uid} product={p} lang={lang} />
        ))}
      </div>
    </section>
  );
}

function CampaignBanner({ data, lang }: Props<"campaign_banner">) {
  const c = data.campaign?.[0];
  if (!c) return null;
  return (
    <section className={`campaign-banner layout-${data.layout ?? "full"}`}>
      <div className="container campaign-inner">
        <div className="campaign-copy">
          {c.eyebrow ? <p className="eyebrow" {...c.$?.eyebrow}>{c.eyebrow}</p> : null}
          <h2 {...c.$?.headline}>{c.headline}</h2>
          {c.summary ? <p className="lede" {...c.$?.summary}>{c.summary}</p> : null}
          <div className="actions">
            <CtaButton cta={c.cta} lang={lang} />
            {c.url ? (
              <SmartLink href={c.url} lang={lang} className="btn btn-ghost-light">
                {c.title} →
              </SmartLink>
            ) : null}
          </div>
        </div>
        <Media asset={c.hero_image} label={c.title} tone="dark" className="campaign-media" cslp={c.$?.hero_image} />
      </div>
    </section>
  );
}

function CategoryTiles({ data, lang }: Props<"category_tiles">) {
  return (
    <section className="section container">
      {data.heading ? <h2 {...data.$?.heading}>{data.heading}</h2> : null}
      <div className="grid grid-2" {...data.$?.categories}>
        {(data.categories ?? []).map((cat) => (
          <SmartLink key={cat.uid} href={cat.url} lang={lang} className="category-tile">
            <Media asset={cat.image} tone="accent" className="category-media" />
            <div className="category-copy">
              <h3 {...cat.$?.title}>{cat.title}</h3>
              {cat.description ? <p {...cat.$?.description}>{cat.description}</p> : null}
            </div>
          </SmartLink>
        ))}
      </div>
    </section>
  );
}

function BrandGrid({ data, lang }: Props<"brand_grid">) {
  return (
    <section className="section container" id="brands">
      {data.heading ? <h2 {...data.$?.heading}>{data.heading}</h2> : null}
      {data.intro ? <p className="lede narrow" {...data.$?.intro}>{data.intro}</p> : null}
      <div className="grid grid-3">
        {(data.brands ?? []).map((b) => (
          <div key={b.uid} className="brand-card" style={{ ["--brand" as string]: b.accent_color }}>
            <span className="brand-chip" />
            <h3 {...b.$?.title}>{b.url ? <a href={localizeHref(b.url, lang)}>{b.title}</a> : b.title}</h3>
            {b.tagline ? <p {...b.$?.tagline}>{b.tagline}</p> : null}
            <Rte doc={b.story} className="muted small" cslp={b.$?.story} />
            <p className="brand-links">
              {b.url ? <a href={localizeHref(b.url, lang)}>{t(lang).ourStory}</a> : null}
              {b.site_url ? <a href={resolveSiteHref(b.site_url, lang)}>{t(lang).visitSite} →</a> : null}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function StoryBlock({ data, lang }: Props<"story_block">) {
  return (
    <section className={`section container story story-${data.image_position ?? "right"}`}>
      <div className="story-copy">
        {data.eyebrow ? <p className="eyebrow" {...data.$?.eyebrow}>{data.eyebrow}</p> : null}
        {data.heading ? <h2 {...data.$?.heading}>{data.heading}</h2> : null}
        <Rte doc={data.body} cslp={data.$?.body} />
        <CtaButton cta={data.cta} lang={lang} />
      </div>
      <Media asset={data.image} tone="soft" className="story-media" cslp={data.$?.image} />
    </section>
  );
}

function StoreList({ data, lang }: Props<"store_list">) {
  return (
    <section className="section container">
      {data.heading ? <h2 {...data.$?.heading}>{data.heading}</h2> : null}
      {data.intro ? <p className="lede narrow" {...data.$?.intro}>{data.intro}</p> : null}
      <div className="grid grid-2">
        {(data.stores ?? []).map((s) => (
          <article key={s.uid} className="store-card">
            <Media asset={s.image} label={s.city} tone="soft" className="store-media" cslp={s.$?.image} />
            <h3 {...s.$?.title}>{s.title}</h3>
            <p className="muted">
              {[s.address?.street, s.address?.postal_code, s.city, s.address?.country].filter(Boolean).join(", ")}
            </p>
            {s.opening_hours?.length ? (
              <dl className="hours">
                {s.opening_hours.map((h, i) => (
                  <div key={i}>
                    <dt>{dayLabel(h.day, lang)}</dt>
                    <dd>{h.opens && h.closes ? `${h.opens}–${h.closes}` : t(lang).closed}</dd>
                  </div>
                ))}
              </dl>
            ) : null}
            {s.phone ? <p className="small">{s.phone}</p> : null}
          </article>
        ))}
      </div>
    </section>
  );
}

/** Modular blocks → components. Unknown blocks are skipped so the model can grow ahead of the front end. */
export function Sections({ sections, lang }: { sections?: Section[]; lang: Lang }) {
  return (
    <>
      {(sections ?? []).map((section, i) => {
        const [type, data] = Object.entries(section)[0] ?? [];
        const key = `${type}-${i}`;
        switch (type) {
          case "hero_carousel":
            return <HeroCarousel key={key} data={data as never} lang={lang} />;
          case "universe_tiles":
            return <UniverseTiles key={key} data={data as never} lang={lang} />;
          case "product_carousel":
            return <ProductCarousel key={key} data={data as never} lang={lang} />;
          case "campaign_banner":
            return <CampaignBanner key={key} data={data as never} lang={lang} />;
          case "category_tiles":
            return <CategoryTiles key={key} data={data as never} lang={lang} />;
          case "brand_grid":
            return <BrandGrid key={key} data={data as never} lang={lang} />;
          case "story_block":
            return <StoryBlock key={key} data={data as never} lang={lang} />;
          case "store_list":
            return <StoreList key={key} data={data as never} lang={lang} />;
          default:
            return null;
        }
      })}
    </>
  );
}

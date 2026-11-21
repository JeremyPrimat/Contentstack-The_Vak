import Link from "next/link";
import type { ReactNode } from "react";
import { localizeHref, type Lang } from "@/lib/i18n";
import { resolveSiteHref } from "@/lib/site";
import type { Asset, Cta, Product } from "@/lib/types";

/** Internal links get the locale prefix; cross-site placeholder links get the real site URL. */
export function SmartLink({ href, lang, className, children, cslp }: { href?: string; lang: Lang; className?: string; children: ReactNode; cslp?: Record<string, string> }) {
  const resolved = resolveSiteHref(href);
  const internal = resolved.startsWith("/") && !resolved.startsWith("//");
  if (internal) {
    return (
      <Link href={localizeHref(resolved, lang)} className={className} {...cslp}>
        {children}
      </Link>
    );
  }
  return (
    <a href={resolved} className={className} {...cslp}>
      {children}
    </a>
  );
}

export function CtaButton({ cta, lang }: { cta?: Cta; lang: Lang }) {
  if (!cta?.label) return null;
  return (
    <SmartLink href={cta.link?.href} lang={lang} className={`btn btn-${cta.style ?? "primary"}`} cslp={cta.$?.label}>
      {cta.label}
    </SmartLink>
  );
}

/**
 * Image with an on-brand placeholder: the seed has no assets yet (no MCP upload tool),
 * so every image slot degrades to a tinted panel with a label instead of a broken image.
 */
export function Media({ asset, label, className, cslp, tone = "accent" }: { asset?: Asset; label?: string; className?: string; cslp?: Record<string, string>; tone?: "accent" | "soft" | "dark" }) {
  if (asset?.url) {
    // Image Delivery API resizes/converts rasters; SVGs are served as-is.
    const isSvg = asset.url.toLowerCase().endsWith(".svg");
    const src = isSvg ? asset.url : `${asset.url}?width=1200&auto=webp&quality=80`;
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={asset.title ?? label ?? ""} loading="lazy" className={["media", isSvg ? "media-svg" : "", className].filter(Boolean).join(" ")} {...cslp} />;
  }
  return (
    <div className={["media", "media-placeholder", `tone-${tone}`, className].filter(Boolean).join(" ")} role="img" aria-label={label ?? ""} {...cslp}>
      {label ? <span>{label}</span> : null}
    </div>
  );
}

export function ProductCard({ product, lang }: { product: Product; lang: Lang }) {
  const swatches = product.colourways ?? [];
  return (
    <article className="product-card">
      <SmartLink href={product.url} lang={lang} className="product-card-link">
        <Media asset={swatches[0]?.images?.[0]} label={product.sku} tone="soft" className="product-card-media" />
        <div className="product-card-body">
          <h3 {...product.$?.title}>{product.title}</h3>
          {product.short_description ? <p className="muted" {...product.$?.short_description}>{product.short_description}</p> : null}
          <div className="product-card-meta">
            <span className="price" {...product.$?.price_label}>{product.price_label}</span>
            <span className="swatches" aria-label={swatches.map((s) => s.name).join(", ")}>
              {swatches.map((s) => (
                <span key={s.name} className="swatch" style={{ background: s.swatch_hex ?? "#ccc" }} title={s.name} />
              ))}
            </span>
          </div>
        </div>
      </SmartLink>
    </article>
  );
}

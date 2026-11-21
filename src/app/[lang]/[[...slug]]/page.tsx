import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLang } from "@/lib/i18n";
import { routeMetadata, RouteView } from "@/lib/routes";

/**
 * Public pages: ISR. Rendered on first request, then served from cache and
 * regenerated in the background, so Next sends `s-maxage=60, stale-while-revalidate`
 * and the Launch CDN can cache them. Publish webhook → "Revalidate CDN cache" in Launch.
 */
export const revalidate = 60;
export const dynamicParams = true;
export function generateStaticParams() {
  return [];
}

type Params = { params: Promise<{ lang: string; slug?: string[] }> };

/** The proxy prefixes personalized requests with /__v/<variantParam>, so each variant is cached on its own path. */
function splitVariant(slug: string[]): { variant: string; slug: string[] } {
  return slug[0] === "__v" && slug[1] ? { variant: decodeURIComponent(slug[1]), slug: slug.slice(2) } : { variant: "", slug };
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { lang, slug: raw = [] } = await params;
  if (!isLang(lang)) return {};
  const { variant, slug } = splitVariant(raw);
  return routeMetadata(lang, slug, null, variant);
}

export default async function Page({ params }: Params) {
  const { lang, slug: raw = [] } = await params;
  if (!isLang(lang)) notFound();
  const { variant, slug } = splitVariant(raw);
  return <RouteView lang={lang} slug={slug} variant={variant} />;
}

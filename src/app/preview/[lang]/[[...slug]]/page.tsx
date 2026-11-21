import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { PreviewParams } from "@/lib/contentstack";
import { isLang } from "@/lib/i18n";
import { routeMetadata, RouteView } from "@/lib/routes";

/**
 * Live Preview / Visual Builder requests. The proxy rewrites any request carrying
 * ?live_preview=… here. Reading searchParams makes this route dynamic, so it is
 * never cached (Next sends `private, no-store`) and always fetches draft content
 * from the Preview API.
 */
type Props = {
  params: Promise<{ lang: string; slug?: string[] }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function previewParams(sp: Record<string, string | string[] | undefined>): PreviewParams {
  const one = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : undefined);
  return {
    live_preview: one("live_preview"),
    content_type_uid: one("content_type_uid"),
    entry_uid: one("entry_uid"),
    preview_timestamp: one("preview_timestamp"),
  };
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { lang, slug = [] } = await params;
  if (!isLang(lang)) return {};
  return { ...(await routeMetadata(lang, slug, previewParams(await searchParams))), robots: { index: false } };
}

export default async function PreviewPage({ params, searchParams }: Props) {
  const { lang, slug = [] } = await params;
  if (!isLang(lang)) notFound();
  return <RouteView lang={lang} slug={slug} preview={previewParams(await searchParams)} />;
}

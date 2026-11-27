import { SiteShell } from "@/components/SiteShell";
import { cms, studioConfig, variantParamToAliases } from "@/lib/contentstack";
import type { Lang } from "@/lib/i18n";
import { StudioPage } from "@/studio/StudioClient";

/**
 * Landing pages composed in Contentstack Studio. The proxy sends /lp/... (and /fr/lp/...) here;
 * the site header and footer stay server-rendered, the composition renders in the browser.
 */
export const dynamic = "force-dynamic";

export default async function StudioRoute({ params, searchParams }: { params: Promise<{ lang: Lang; slug?: string[] }>; searchParams: Promise<{ __v?: string }> }) {
  const { lang, slug = [] } = await params;
  // Personalize variant from the proxy: the header announcement follows the visitor's country here too.
  const { __v } = await searchParams;
  const api = cms(lang, null, variantParamToAliases(__v));
  const [header, footer] = await Promise.all([api.header(), api.footer()]);
  const path = "/" + slug.join("/");
  return (
    <SiteShell lang={lang} path={path} header={header} footer={footer}>
      <StudioPage config={studioConfig(lang)} url={path} />
    </SiteShell>
  );
}

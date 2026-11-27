import { SiteShell } from "@/components/SiteShell";
import { cms, studioConfig } from "@/lib/contentstack";
import type { Lang } from "@/lib/i18n";
import { StudioPage } from "@/studio/StudioClient";

/**
 * Landing pages composed in Contentstack Studio. The proxy sends /lp/... (and /fr/lp/...) here;
 * the site header and footer stay server-rendered, the composition renders in the browser.
 */
export const dynamic = "force-dynamic";

export default async function StudioRoute({ params }: { params: Promise<{ lang: Lang; slug?: string[] }> }) {
  const { lang, slug = [] } = await params;
  const api = cms(lang);
  const [header, footer] = await Promise.all([api.header(), api.footer()]);
  const path = "/" + slug.join("/");
  return (
    <SiteShell lang={lang} path={path} header={header} footer={footer}>
      <StudioPage config={studioConfig(lang)} url={path} />
    </SiteShell>
  );
}

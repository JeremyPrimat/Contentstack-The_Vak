import { studioConfig } from "@/lib/contentstack";
import { StudioCanvasPage } from "@/studio/StudioClient";

/** Canvas URL for Contentstack Studio: the editor loads this page in its iframe. */
export const dynamic = "force-dynamic";

export default function CanvasRoute() {
  return <StudioCanvasPage config={studioConfig("en")} />;
}

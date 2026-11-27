import Personalize from "@contentstack/personalize-edge-sdk";
import { NextResponse, type NextRequest } from "next/server";
import { personalizeProjectUid } from "@/lib/site";

const PREFIXED = new Set(["fr", "it", "es"]);
const AFFINITIES = new Set(["surf", "skate", "snow"]);
const PERSONALIZE_PROJECT_UID = personalizeProjectUid();

/**
 * URL scheme: English has no prefix (`/about`), other languages do (`/fr/about`).
 * Internally every page lives under /[lang]. Requests from the Live Preview iframe
 * (?live_preview=…) go to the dynamic /preview tree instead of the cached one.
 *
 * Personalize (when a project UID is configured): the visitor's `affinity` attribute
 * (set from ?affinity=surf|skate|snow and remembered by Personalize) picks a variant.
 * The variant is encoded in the internal path (/en/__v/<variantParam>/...) so the ISR
 * cache keeps one copy per variant instead of mixing them up.
 */
export async function proxy(request: NextRequest) {
  const url = request.nextUrl;
  const [first, ...rest] = url.pathname.split("/").filter(Boolean);

  // /en/... is the same as /... — keep one canonical URL.
  if (first === "en") {
    const target = url.clone();
    target.pathname = "/" + rest.join("/");
    return NextResponse.redirect(target, 308);
  }
  if (first === "preview" || first === "__v" || first === "studio") return new NextResponse(null, { status: 404 });
  // Contentstack Studio's editor iframe (Canvas URL): served as is.
  if (first === "studio-canvas") return NextResponse.next();

  const lang = first && PREFIXED.has(first) ? first : "en";
  const remainder = first && PREFIXED.has(first) ? rest : [first, ...rest].filter(Boolean);
  const isPreview = url.searchParams.has("live_preview");
  const path = remainder.length ? "/" + remainder.join("/") : "";

  const target = url.clone();
  // Landing pages composed in Contentstack Studio live under /lp/....
  if (remainder[0] === "lp") {
    target.pathname = `/studio/${lang}${path}`;
    return NextResponse.rewrite(target);
  }
  if (isPreview || !PERSONALIZE_PROJECT_UID) {
    target.pathname = `${isPreview ? "/preview" : ""}/${lang}${path}`;
    return NextResponse.rewrite(target);
  }

  try {
    const affinity = url.searchParams.get("affinity");
    const liveAttributes = affinity && AFFINITIES.has(affinity) ? { affinity } : undefined;
    const sdk = await Personalize.init(PERSONALIZE_PROJECT_UID, { request, liveAttributes });
    if (liveAttributes) await sdk.set(liveAttributes); // remember it for the next visits
    const variantParam = sdk.getVariantParam();
    target.pathname = variantParam ? `/${lang}/__v/${encodeURIComponent(variantParam)}${path}` : `/${lang}${path}`;
    const response = NextResponse.rewrite(target);
    sdk.addStateToResponse(response); // user id + manifest cookies
    return response;
  } catch (error) {
    // Personalize must never take the site down: serve the default content.
    console.warn("[personalize] init failed, serving default content:", (error as Error).message);
    target.pathname = `/${lang}${path}`;
    return NextResponse.rewrite(target);
  }
}

export const config = {
  matcher: ["/((?!_next/|api/|favicon.ico|.*\\.[a-zA-Z0-9]+$).*)"],
};

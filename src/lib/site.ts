/**
 * Site factory configuration.
 *
 * One codebase renders four sites. Each deployment (one Launch project per site)
 * picks its site with SITE and points at its own stack. Everything that differs
 * between sites lives in the stack (content, brand colour, navigation), so this
 * file only knows how to find the right stack.
 */
import { Region } from "@contentstack/delivery-sdk";

export const SITE_IDS = ["group", "surf", "skate", "snow"] as const;
export type SiteId = (typeof SITE_IDS)[number];

type SiteDefaults = { name: string; fallbackAccent: string };

const DEFAULTS: Record<SiteId, SiteDefaults> = {
  group: { name: "The Vak", fallbackAccent: "#111111" },
  surf: { name: "Vak Surf", fallbackAccent: "#00A8B5" },
  skate: { name: "Vak Skate", fallbackAccent: "#FF5A1F" },
  snow: { name: "Vak Snow", fallbackAccent: "#3D5AFE" },
};

function readSiteId(): SiteId {
  const raw = (process.env.SITE ?? "group").toLowerCase();
  if ((SITE_IDS as readonly string[]).includes(raw)) return raw as SiteId;
  throw new Error(`SITE must be one of ${SITE_IDS.join(", ")} (got "${raw}")`);
}

/** Generic variable first (one Launch project = one stack), then the per-site one (local dev). */
function env(generic: string, site: SiteId, suffix: string): string | undefined {
  return process.env[generic] || process.env[`VAK_${site.toUpperCase()}_${suffix}`] || undefined;
}

function readRegion(): Region {
  const raw = (process.env.CONTENTSTACK_REGION ?? "us").toLowerCase();
  const match = Object.values(Region).find((r) => r === raw);
  return match ?? Region.US;
}

export type SiteConfig = {
  id: SiteId;
  name: string;
  fallbackAccent: string;
  isGroup: boolean;
  stack: {
    apiKey: string;
    deliveryToken: string;
    previewToken?: string;
    environment: string;
    region: Region;
  };
};

let cached: SiteConfig | undefined;

export function getSite(): SiteConfig {
  if (cached) return cached;
  const id = readSiteId();
  const apiKey = env("CONTENTSTACK_API_KEY", id, "API_KEY");
  const deliveryToken = env("CONTENTSTACK_DELIVERY_TOKEN", id, "DELIVERY_TOKEN");
  if (!apiKey || !deliveryToken) {
    throw new Error(
      `Missing stack credentials for site "${id}". Set CONTENTSTACK_API_KEY / CONTENTSTACK_DELIVERY_TOKEN ` +
        `or VAK_${id.toUpperCase()}_API_KEY / VAK_${id.toUpperCase()}_DELIVERY_TOKEN (see .env.example).`,
    );
  }
  cached = {
    id,
    ...DEFAULTS[id],
    isGroup: id === "group",
    stack: {
      apiKey,
      deliveryToken,
      previewToken: env("CONTENTSTACK_PREVIEW_TOKEN", id, "PREVIEW_TOKEN"),
      environment: process.env.CONTENTSTACK_ENVIRONMENT ?? "development",
      region: readRegion(),
    },
  };
  return cached;
}

/** Public base URL of each site, used to rewrite the placeholder domains stored in content. */
const PUBLIC_URLS: Record<SiteId, string | undefined> = {
  group: process.env.NEXT_PUBLIC_GROUP_URL,
  surf: process.env.NEXT_PUBLIC_SURF_URL,
  skate: process.env.NEXT_PUBLIC_SKATE_URL,
  snow: process.env.NEXT_PUBLIC_SNOW_URL,
};

const PLACEHOLDER_HOSTS: Record<string, SiteId> = {
  "thevak.example": "group",
  "surf.thevak.example": "surf",
  "skate.thevak.example": "skate",
  "snow.thevak.example": "snow",
};

/**
 * Content stores cross-site links with stable placeholder domains (*.thevak.example)
 * so editors never paste environment-specific URLs. Each deployment maps them to
 * the real site URLs it knows about. With a language, the link keeps it
 * (a French visitor of the group site lands on the French brand site).
 */
export function resolveSiteHref(href: string | undefined, lang?: string): string {
  if (!href) return "#";
  try {
    const url = new URL(href);
    const target = PLACEHOLDER_HOSTS[url.host];
    const base = target ? PUBLIC_URLS[target] : undefined;
    if (!target || !base) return href;
    const path = url.pathname.replace(/^\/$/, "");
    const prefix = lang && lang !== "en" ? `/${lang}` : "";
    // Behavioral personalization: a visitor coming back to the group site from a brand site
    // carries that brand's universe, so the group home leads with it.
    const current = process.env.SITE;
    if (target === "group" && (current === "surf" || current === "skate" || current === "snow")) url.searchParams.set("affinity", current);
    return base.replace(/\/$/, "") + prefix + path + url.search + url.hash;
  } catch {
    return href; // relative link
  }
}

/** Personalize project of this site, if any (generic var first, then VAK_<SITE>_PERSONALIZE_PROJECT_UID). */
export function personalizeProjectUid(): string | undefined {
  const site = (process.env.SITE ?? "group").toUpperCase();
  return process.env.CONTENTSTACK_PERSONALIZE_PROJECT_UID || process.env[`VAK_${site}_PERSONALIZE_PROJECT_UID`] || undefined;
}

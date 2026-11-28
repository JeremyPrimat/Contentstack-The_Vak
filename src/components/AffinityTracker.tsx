"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

type Affinity = "surf" | "skate" | "snow";

/** Origins of the brand sites, so a click towards one of them tells us the visitor's universe. */
const BRAND_ORIGINS: [string | undefined, Affinity][] = [
  [process.env.NEXT_PUBLIC_SURF_URL, "surf"],
  [process.env.NEXT_PUBLIC_SKATE_URL, "skate"],
  [process.env.NEXT_PUBLIC_SNOW_URL, "snow"],
];

function affinityOfHref(href: string): Affinity | undefined {
  try {
    const origin = new URL(href, window.location.href).origin;
    return BRAND_ORIGINS.find(([base]) => base && new URL(base).origin === origin)?.[1];
  } catch {
    return undefined;
  }
}

/**
 * Behavioral personalization on the group site. Personalize attributes follow what the visitor does:
 *  - each visit of a brand page of the group site (/brands/vak-snow) increments `snow_views` (an engagement
 *    counter, kept in a cookie and sent to Personalize); the audience "Snow riders" matches from 2 views;
 *  - clicking through to a brand site (universe tiles, hero CTAs, brand cards, mega menu) sets `affinity` at once.
 * Personalize stores them against the visitor's id cookie, so the next page served by the proxy
 * (e.g. the home hero) uses them. Explicit ?affinity= links are handled by the proxy.
 */
/** Last path counted, so React's double effects in development do not count one visit twice. */
let lastCounted = "";

export function AffinityTracker({ projectUid }: { projectUid: string }) {
  const pathname = usePathname();
  useEffect(() => {
    let sdk: { set: (attrs: Record<string, string | number>) => Promise<void> } | undefined;
    const ready = import("@contentstack/personalize-edge-sdk").then(async ({ default: Personalize }) => {
      sdk = await Personalize.init(projectUid);
      return sdk;
    });
    const setAttrs = async (attrs: Record<string, string | number>) => {
      const s = sdk ?? (await ready);
      await s.set(attrs);
    };
    const remember = (affinity: Affinity) => setAttrs({ affinity });

    const page = pathname.match(/\/brands\/vak-(surf|skate|snow)\b/);
    const counted = page && lastCounted !== pathname;
    lastCounted = pathname;
    if (page && counted) {
      const key = `${page[1]}_views`;
      // Kept in a first-party cookie: the proxy sends it to Personalize with every request
      // (live attributes), so the next page is personalized even if this call is lost.
      const views = Number(document.cookie.match(new RegExp(`(?:^|; )vak_${key}=(\\d+)`))?.[1] || 0) + 1;
      document.cookie = `vak_${key}=${views}; Max-Age=31536000; Path=/; SameSite=Lax; Secure`;
      setAttrs({ [key]: views }).catch(() => {});
    }

    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = (event.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      const affinity = link && !link.target ? affinityOfHref(link.href) : undefined;
      if (!link || !affinity) return;
      // Leave once Personalize has the attribute (or after 800 ms: never block the visitor).
      event.preventDefault();
      const go = () => window.location.assign(link.href);
      Promise.race([remember(affinity), new Promise((r) => setTimeout(r, 800))]).then(go, go);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [projectUid, pathname]);
  return null;
}

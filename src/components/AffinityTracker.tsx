"use client";

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
 * Behavioral personalization on the group site. The visitor's `affinity` attribute follows what they do:
 *  - opening a brand page of the group site (/brands/vak-snow) → snow;
 *  - clicking through to a brand site (universe tiles, hero CTAs, brand cards, mega menu) → that brand.
 * Personalize stores it against the visitor's id cookie, so the next page served by the proxy
 * (e.g. the home hero) uses it. Explicit ?affinity= links are handled by the proxy.
 */
export function AffinityTracker({ projectUid }: { projectUid: string }) {
  useEffect(() => {
    let sdk: { set: (attrs: Record<string, string>) => Promise<void> } | undefined;
    const ready = import("@contentstack/personalize-edge-sdk").then(async ({ default: Personalize }) => {
      sdk = await Personalize.init(projectUid);
      return sdk;
    });
    const remember = async (affinity: Affinity) => {
      const s = sdk ?? (await ready);
      await s.set({ affinity });
    };

    const page = window.location.pathname.match(/\/brands\/vak-(surf|skate|snow)\b/);
    if (page) remember(page[1] as Affinity).catch(() => {});

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
  }, [projectUid]);
  return null;
}

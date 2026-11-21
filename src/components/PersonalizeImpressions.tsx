"use client";

import { useEffect } from "react";

/** Reports which Personalize variants this visitor saw (feeds the experience analytics). */
export function PersonalizeImpressions({ projectUid, aliases }: { projectUid: string; aliases: string[] }) {
  const key = aliases.join(",");
  useEffect(() => {
    if (!key) return;
    let cancelled = false;
    import("@contentstack/personalize-edge-sdk").then(async ({ default: Personalize }) => {
      const sdk = await Personalize.init(projectUid);
      if (!cancelled) await sdk.triggerImpressions({ aliases: key.split(",") });
    }).catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [projectUid, key]);
  return null;
}

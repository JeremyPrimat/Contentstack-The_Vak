"use client";

import { useEffect } from "react";

/**
 * Starts the Live Preview / Visual Builder SDK inside the CMS iframe.
 * SSR mode: on every edit the CMS reloads the iframe with ?live_preview=…,
 * which the proxy routes to the uncached /preview tree.
 */
export function LivePreview({ apiKey, environment, appHost }: { apiKey: string; environment: string; appHost: string }) {
  useEffect(() => {
    // Only inside the CMS (Live Preview panel / Visual Builder iframe): public visitors get no SDK, no edit button.
    if (window.self === window.top) return;
    let cancelled = false;
    import("@contentstack/live-preview-utils").then(({ default: ContentstackLivePreview }) => {
      if (cancelled) return;
      ContentstackLivePreview.init({
        ssr: true,
        enable: true,
        mode: "builder",
        stackDetails: { apiKey, environment },
        clientUrlParams: { host: appHost },
        editButton: { enable: true },
      });
    });
    return () => {
      cancelled = true;
    };
  }, [apiKey, environment, appHost]);
  return null;
}

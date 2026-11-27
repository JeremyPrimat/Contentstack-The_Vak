"use client";

import contentstack from "@contentstack/delivery-sdk";
import ContentstackLivePreview from "@contentstack/live-preview-utils";
import { StudioCanvas, StudioComponent, studioSdk, useCompositionData } from "@contentstack/studio-react";
import { useEffect } from "react";
import "./components";

export type StudioConfig = {
  apiKey: string;
  deliveryToken: string;
  previewToken?: string;
  environment: string;
  previewHost: string;
  appHost: string;
  locale: string;
};

let started = false;

/** Delivery SDK + Live Preview + Studio SDK, once per browser tab. */
function start(cfg: StudioConfig) {
  if (started) return;
  started = true;
  const stack = contentstack.stack({
    apiKey: cfg.apiKey,
    deliveryToken: cfg.deliveryToken,
    environment: cfg.environment,
    live_preview: { enable: Boolean(cfg.previewToken), preview_token: cfg.previewToken, host: cfg.previewHost },
  });
  ContentstackLivePreview.init({
    ssr: false,
    enable: Boolean(cfg.previewToken),
    mode: "builder",
    stackSdk: stack.config as never,
    stackDetails: { apiKey: cfg.apiKey, environment: cfg.environment },
    clientUrlParams: { host: cfg.appHost },
    editButton: { enable: false },
  });
  studioSdk.init({ stackSdk: stack, locale: cfg.locale });
}

/** A Studio landing page, found by its URL (e.g. /lp/first-snow). */
export function StudioPage({ config, url }: { config: StudioConfig; url: string }) {
  start(config);
  const { specOptions, isLoading, error, refetchSpec } = useCompositionData({ url }, { locale: config.locale });
  useEffect(() => {
    const id = ContentstackLivePreview.onEntryChange(refetchSpec);
    return () => {
      if (typeof id === "string") ContentstackLivePreview.unsubscribeOnEntryChange(id);
    };
  }, [refetchSpec]);
  if (isLoading) return <div className="section container muted">Loading…</div>;
  if (error || !specOptions) {
    return (
      <section className="section container">
        <h1>Page not found</h1>
        <p className="lede">No Studio page is published at {url}.</p>
      </section>
    );
  }
  return <StudioComponent specOptions={specOptions} />;
}

/** The page Studio loads in its editor iframe (its "Canvas URL"). */
export function StudioCanvasPage({ config }: { config: StudioConfig }) {
  start(config);
  return <StudioCanvas />;
}

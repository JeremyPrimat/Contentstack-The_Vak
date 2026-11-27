"use client";

import type { ReactNode } from "react";
import { registerComponents } from "@contentstack/studio-react";

/**
 * The Vak components registered in Contentstack Studio. Marketers compose landing pages
 * (/lp/...) from these in the Studio canvas; the markup reuses the site's own classes,
 * so a Studio page looks like the rest of the site.
 */

const img = (url?: string) => (url && !url.toLowerCase().endsWith(".svg") && url.includes("contentstack.io") ? `${url}?width=1600&auto=webp&quality=80` : url);

function VakHero({ eyebrow, heading, subheading, image, ctaLabel, ctaHref }: { eyebrow?: string; heading?: string; subheading?: string; image?: string; ctaLabel?: string; ctaHref?: string }) {
  return (
    <section className="hero">
      <div className="hero-track">
        <div className="hero-slide">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {image ? <img src={img(image)} alt="" className="media hero-media" /> : <div className="media media-placeholder tone-dark hero-media" />}
          <div className="hero-copy container">
            {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
            <h1>{heading}</h1>
            {subheading ? <p className="lede">{subheading}</p> : null}
            {ctaLabel ? <a href={ctaHref || "#"} className="btn btn-primary">{ctaLabel}</a> : null}
          </div>
        </div>
      </div>
    </section>
  );
}

function VakPromoBanner({ eyebrow, heading, text, image, ctaLabel, ctaHref }: { eyebrow?: string; heading?: string; text?: string; image?: string; ctaLabel?: string; ctaHref?: string }) {
  return (
    <section className="campaign-banner layout-full">
      <div className="container campaign-inner">
        <div className="campaign-copy">
          {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
          <h2>{heading}</h2>
          {text ? <p className="lede">{text}</p> : null}
          {ctaLabel ? (
            <div className="actions">
              <a href={ctaHref || "#"} className="btn btn-primary">{ctaLabel}</a>
            </div>
          ) : null}
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {image ? <img src={img(image)} alt="" className="media campaign-media" /> : <div className="media media-placeholder tone-dark campaign-media" />}
      </div>
    </section>
  );
}

function VakStory({ eyebrow, heading, text, image, imagePosition }: { eyebrow?: string; heading?: string; text?: string; image?: string; imagePosition?: "left" | "right" }) {
  return (
    <section className={`section container story story-${imagePosition ?? "right"}`}>
      <div className="story-copy">
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        {heading ? <h2>{heading}</h2> : null}
        {text ? <p>{text}</p> : null}
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {image ? <img src={img(image)} alt="" className="media story-media" /> : <div className="media media-placeholder tone-soft story-media" />}
    </section>
  );
}

function VakSection({ heading, intro, children }: { heading?: string; intro?: string; children?: ReactNode }) {
  return (
    <section className="section container">
      {heading ? <h2>{heading}</h2> : null}
      {intro ? <p className="lede narrow">{intro}</p> : null}
      <div className="grid grid-3">{children}</div>
    </section>
  );
}

function VakCard({ title, text, image, href }: { title?: string; text?: string; image?: string; href?: string }) {
  return (
    <a href={href || "#"} className="brand-card">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {image ? <img src={img(image)} alt="" className="media" style={{ borderRadius: 12, marginBottom: 12, aspectRatio: "4 / 3", objectFit: "cover" }} /> : null}
      <h3>{title}</h3>
      {text ? <p>{text}</p> : null}
    </a>
  );
}

const cta = {
  ctaLabel: { type: "string", displayName: "Button label" },
  ctaHref: { type: "href", displayName: "Button link" },
} as const;

registerComponents([
  {
    type: "vak-hero",
    displayName: "Vak hero",
    component: VakHero,
    props: {
      eyebrow: { type: "string", displayName: "Eyebrow" },
      heading: { type: "string", displayName: "Heading", defaultValue: "Cold water, warm crew." },
      subheading: { type: "string", displayName: "Subheading" },
      image: { type: "imageurl", displayName: "Background image" },
      ...cta,
    },
  },
  {
    type: "vak-promo-banner",
    displayName: "Vak promo banner",
    component: VakPromoBanner,
    props: {
      eyebrow: { type: "string", displayName: "Eyebrow" },
      heading: { type: "string", displayName: "Heading", defaultValue: "The cold is where the good stuff starts." },
      text: { type: "string", displayName: "Text" },
      image: { type: "imageurl", displayName: "Image" },
      ...cta,
    },
  },
  {
    type: "vak-story",
    displayName: "Vak story",
    component: VakStory,
    props: {
      eyebrow: { type: "string", displayName: "Eyebrow" },
      heading: { type: "string", displayName: "Heading" },
      text: { type: "string", displayName: "Text" },
      image: { type: "imageurl", displayName: "Image" },
      imagePosition: { type: "choice", displayName: "Image position", options: [{ key: "right", value: "right" }, { key: "left", value: "left" }], defaultValue: "right" },
    },
  },
  {
    type: "vak-section",
    displayName: "Vak card section",
    component: VakSection,
    props: {
      heading: { type: "string", displayName: "Heading" },
      intro: { type: "string", displayName: "Intro" },
      children: { type: "slot", displayName: "Cards" },
    },
  },
  {
    type: "vak-card",
    displayName: "Vak card",
    component: VakCard,
    props: {
      title: { type: "string", displayName: "Title" },
      text: { type: "string", displayName: "Text" },
      image: { type: "imageurl", displayName: "Image" },
      href: { type: "href", displayName: "Link" },
    },
  },
] as never);

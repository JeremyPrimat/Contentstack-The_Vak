/** Types for the factory content model (shared by all four stacks). */

/** Live Preview / Visual Builder edit tags added by addEditableTags (tagsAsObject = true). */
export type Cslp = Record<string, string>;
type Editable = { $?: Record<string, Cslp> };

export type Asset = Editable & { uid: string; url: string; title?: string; filename?: string };
export type Link = { title?: string; href?: string };
export type TaxonomyTag = { taxonomy_uid: string; term_uid: string };
export type CtaStyle = "primary" | "secondary" | "ghost";
export type Cta = Editable & { label?: string; link?: Link; style?: CtaStyle };
export type Seo = { meta_title?: string; meta_description?: string; og_image?: Asset; canonical_url?: string; no_index?: boolean };

/** JSON RTE document. */
export type RteNode = {
  type?: string;
  uid?: string;
  attrs?: Record<string, unknown>;
  children?: RteNode[];
  text?: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
};
export type RteDoc = RteNode & { type: "doc" };

export type EntryBase = Editable & {
  uid: string;
  title: string;
  locale?: string;
  url?: string;
  _content_type_uid?: string;
  taxonomies?: TaxonomyTag[];
};

export type Brand = EntryBase & {
  accent_color: string;
  tagline?: string;
  story?: RteDoc;
  logo?: Asset;
  hero_image?: Asset;
  site_url?: string;
};

export type Category = EntryBase & { description?: string; image?: Asset; parent?: Category[] };

export type Colourway = Editable & { name: string; swatch_hex?: string; images?: Asset[] };

export type Product = EntryBase & {
  sku: string;
  brand?: Brand[];
  category?: Category[];
  price_label?: string;
  short_description?: string;
  description?: RteDoc;
  colourways?: Colourway[];
  sizes?: string[];
  features?: string[];
  composition?: string;
  related_products?: Product[];
  seo?: Seo;
};

export type Campaign = EntryBase & {
  start_date?: string;
  end_date?: string;
  eyebrow?: string;
  headline: string;
  summary?: string;
  hero_image?: Asset;
  brand?: Brand[];
  products?: Product[];
  cta?: Cta;
  seo?: Seo;
};

export type Store = EntryBase & {
  city: string;
  address?: { street?: string; postal_code?: string; country?: string };
  latitude?: number;
  longitude?: number;
  opening_hours?: { day?: string; opens?: string; closes?: string }[];
  phone?: string;
  image?: Asset;
};

export type Article = EntryBase & {
  type: "guide" | "story";
  author?: string;
  published_date?: string;
  cover_image?: Asset;
  excerpt?: string;
  body?: RteDoc;
  related_products?: Product[];
  seo?: Seo;
};

type Block<K extends string, V> = { [P in K]: Editable & V };

export type HeroSlide = Editable & {
  eyebrow?: string;
  heading: string;
  subheading?: string;
  image?: Asset;
  activity?: "surf" | "skate" | "snow" | "all";
  cta?: Cta;
};

export type Section =
  | Block<"hero_carousel", { slides?: HeroSlide[] }>
  | Block<"universe_tiles", { heading?: string; tiles?: (Editable & { brand?: Brand[]; label?: string; image?: Asset; cta?: Cta })[] }>
  | Block<"product_carousel", { heading?: string; products?: Product[]; cta?: Cta }>
  | Block<"campaign_banner", { campaign?: Campaign[]; layout?: "full" | "left" | "right" }>
  | Block<"category_tiles", { heading?: string; categories?: Category[] }>
  | Block<"brand_grid", { heading?: string; intro?: string; brands?: Brand[] }>
  | Block<"story_block", { eyebrow?: string; heading?: string; body?: RteDoc; image?: Asset; image_position?: "left" | "right"; cta?: Cta }>
  | Block<"store_list", { heading?: string; intro?: string; stores?: Store[] }>;

export type Page = EntryBase & { url: string; theme_brand?: Brand[]; sections?: Section[]; seo?: Seo };

export type MegaMenuItem = Editable & {
  label: string;
  gender?: "women" | "men" | "kids" | "all";
  link?: Link;
  columns?: (Editable & { heading?: string; activity?: string; links?: Link[] })[];
};

export type Header = EntryBase & { logo?: Asset; announcement?: string; mega_menu?: MegaMenuItem[]; utility_links?: Link[] };

export type Footer = EntryBase & {
  columns?: (Editable & { heading?: string; links?: Link[] })[];
  newsletter_heading?: string;
  newsletter_text?: string;
  social_links?: { platform?: string; url?: string }[];
  legal_text?: string;
};

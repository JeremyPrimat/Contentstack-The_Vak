/**
 * Locales vs markets: the locale picks the language, the `market` taxonomy picks
 * what is shown where. English has no URL prefix (it also serves the NL market).
 */
export const LANGS = ["en", "fr", "it", "es"] as const;
export type Lang = (typeof LANGS)[number];

export const DEFAULT_LANG: Lang = "en";

export const LOCALE_BY_LANG: Record<Lang, string> = {
  en: "en-us",
  fr: "fr-fr",
  it: "it-it",
  es: "es-es",
};

export const LANG_LABEL: Record<Lang, string> = { en: "EN", fr: "FR", it: "IT", es: "ES" };

export function isLang(value: string): value is Lang {
  return (LANGS as readonly string[]).includes(value);
}

/** Internal path → public URL for a language (`/about` → `/fr/about`). External links are untouched. */
export function localizeHref(href: string | undefined, lang: Lang): string {
  if (!href) return "#";
  if (!href.startsWith("/") || href.startsWith("//")) return href;
  if (lang === DEFAULT_LANG) return href;
  return href === "/" ? `/${lang}` : `/${lang}${href}`;
}

const UI = {
  en: { closed: "Closed", shopNow: "Shop now", related: "You may also like", features: "Features", sizes: "Sizes", composition: "Composition", colourways: "Colourways", guides: "Guides", products: "Products", empty: "Nothing here yet.", stores: "Stores", openingHours: "Opening hours", notFound: "This page drifted out to sea.", backHome: "Back to the homepage", inCampaign: "In this drop", shopBrands: "Shop on our brand sites", ourStory: "Our story", visitSite: "Visit the site" },
  fr: { closed: "Fermé", shopNow: "Découvrir", related: "Ça devrait te plaire", features: "Points forts", sizes: "Tailles", composition: "Composition", colourways: "Coloris", guides: "Guides", products: "Produits", empty: "Rien ici pour l'instant.", stores: "Magasins", openingHours: "Horaires", notFound: "Cette page a pris le large.", backHome: "Retour à l'accueil", inCampaign: "Dans cette collection", shopBrands: "Acheter sur nos sites de marque", ourStory: "Notre histoire", visitSite: "Voir le site" },
  it: { closed: "Chiuso", shopNow: "Scopri", related: "Potrebbe piacerti", features: "Caratteristiche", sizes: "Taglie", composition: "Composizione", colourways: "Colori", guides: "Guide", products: "Prodotti", empty: "Ancora niente qui.", stores: "Negozi", openingHours: "Orari", notFound: "Questa pagina è andata al largo.", backHome: "Torna alla home", inCampaign: "In questa collezione", shopBrands: "Acquista sui siti dei nostri brand", ourStory: "La nostra storia", visitSite: "Vai al sito" },
  es: { closed: "Cerrado", shopNow: "Descubrir", related: "También te puede gustar", features: "Características", sizes: "Tallas", composition: "Composición", colourways: "Colores", guides: "Guías", products: "Productos", empty: "Todavía no hay nada aquí.", stores: "Tiendas", openingHours: "Horario", notFound: "Esta página se ha ido mar adentro.", backHome: "Volver al inicio", inCampaign: "En esta colección", shopBrands: "Compra en nuestras marcas", ourStory: "Nuestra historia", visitSite: "Ver la web" },
} satisfies Record<Lang, Record<string, string>>;

export type UiStrings = (typeof UI)["en"];

/** Store opening-hours days are enum values in the model (English); the label is localized here. */
const DAYS: Record<Lang, Record<string, string>> = {
  en: {},
  fr: { Monday: "Lundi", Tuesday: "Mardi", Wednesday: "Mercredi", Thursday: "Jeudi", Friday: "Vendredi", Saturday: "Samedi", Sunday: "Dimanche" },
  it: { Monday: "Lunedì", Tuesday: "Martedì", Wednesday: "Mercoledì", Thursday: "Giovedì", Friday: "Venerdì", Saturday: "Sabato", Sunday: "Domenica" },
  es: { Monday: "Lunes", Tuesday: "Martes", Wednesday: "Miércoles", Thursday: "Jueves", Friday: "Viernes", Saturday: "Sábado", Sunday: "Domingo" },
};
export function dayLabel(day: string | undefined, lang: Lang): string {
  return (day && DAYS[lang][day]) || day || "";
}

export function t(lang: Lang): UiStrings {
  return UI[lang];
}

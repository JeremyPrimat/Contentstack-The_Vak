// Localizes the Personalize variants of the group Home page (hero only) into fr-fr, it-it, es-es,
// reusing contentstack/i18n/translations.json. Variants are per locale: without this, a French
// visitor with an affinity sees the English hero of the en-us variant.
const fs = require("fs");
const path = require("path");
const CLI_UTILS = path.join(process.env.HOME, ".npm-global/lib/node_modules/@contentstack/cli/node_modules/@contentstack/cli-utilities");
const { managementSDKClient, authenticationHandler } = require(CLI_UTILS);

const ROOT = path.join(__dirname, "..");
const dict = JSON.parse(fs.readFileSync(path.join(ROOT, "contentstack/i18n/translations.json"), "utf8"));
const apiKey = fs.readFileSync(path.join(ROOT, ".env.local"), "utf8").match(/^VAK_GROUP_API_KEY=(.+)$/m)[1].trim();
const ENTRY = "blt3402a8e8b9cb6f1d";
const VARIANTS = { csed40c42ca7cff7c7: "Surf", cs824857e34e70a168: "Skate", cscc9de5d2f2978a80: "Snow" };
const PICKED = { "fr-fr": "choisi pour toi", "it-it": "scelto per te", "es-es": "elegido para ti" };
const LOCALES = Object.keys(PICKED);

function tr(s, locale) {
  const m = s.match(/^(Vak \w+) · picked for you$/);
  if (m) return `${m[1]} · ${PICKED[locale]}`;
  return dict[s]?.[locale] ?? s;
}

(async () => {
  await authenticationHandler.getAuthDetails();
  const c = await managementSDKClient({ host: "api.contentstack.io" });
  const headers = { api_key: apiKey };
  for (const [vuid, name] of Object.entries(VARIANTS)) {
    const { data } = await c.axiosInstance.get(`/content_types/page/entries/${ENTRY}/variants/${vuid}`, { headers, params: { locale: "en-us" } });
    const base = data.entry;
    for (const locale of LOCALES) {
      const hero = JSON.parse(JSON.stringify(base.sections[0]));
      for (const s of hero.hero_carousel.slides) {
        for (const k of ["eyebrow", "heading", "subheading"]) if (s[k]) s[k] = tr(s[k], locale);
        if (s.cta?.label) s.cta.label = tr(s.cta.label, locale);
        if (s.cta?.link?.title) s.cta.link.title = tr(s.cta.link.title, locale);
        if (s.image && typeof s.image === "object") s.image = s.image.uid;
      }
      const body = { entry: { sections: [hero], _variant: { _change_set: base._variant._change_set } } };
      await c.axiosInstance.put(`/content_types/page/entries/${ENTRY}/variants/${vuid}`, body, { headers, params: { locale } });
      console.log(`${name} ${locale}: ${hero.hero_carousel.slides[0].eyebrow} — ${hero.hero_carousel.slides[0].heading}`);
    }
  }
})().catch((e) => {
  console.error("ERROR", e.message, JSON.stringify(e.response?.data || ""));
  process.exit(1);
});

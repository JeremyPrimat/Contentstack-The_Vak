#!/usr/bin/env node
/**
 * Sets up geographic personalization on the group site's Personalize project:
 *   - 4 audiences "Visitors in <country>": Country = NL/FR/IT/ES, OR ?market=nl|fr|it|es
 *     (the query parameter lets a presenter show another country without a VPN);
 *   - a segmented experience "Local announcement by country" with one variant per audience.
 * Idempotent: existing audiences and the experience (matched by name) are reused.
 * Uses the Personalize Management API with the Contentstack CLI session (`csdx auth:login`).
 *
 *   node scripts/personalize-geo.cjs
 */
const fs = require("fs");
const path = require("path");
const U = require(path.join(process.env.HOME, ".npm-global/lib/node_modules/@contentstack/cli/node_modules/@contentstack/cli-utilities"));

const ENV_FILE = path.join(__dirname, "..", ".env.local");
const PROJECT = fs.readFileSync(ENV_FILE, "utf8").match(/^VAK_GROUP_PERSONALIZE_PROJECT_UID=(.+)$/m)[1].trim();
const API = "https://personalize-api.contentstack.com";
const EXPERIENCE = "Local announcement by country";
const MARKETS = [
  ["NL", "Netherlands"],
  ["FR", "France"],
  ["IT", "Italy"],
  ["ES", "Spain"],
];

let headers;
async function call(method, p, body) {
  const res = await fetch(API + p, { method, headers, body: body && JSON.stringify(body) });
  const text = await res.text();
  if (!res.ok) throw new Error(`${method} ${p} → ${res.status} ${text}`);
  return text ? JSON.parse(text) : null;
}

const rule = (attribute, condition, options) => ({ __type: "Rule", attribute: { __type: "PresetAttributeReference", ref: attribute }, attributeMatchCondition: condition, attributeMatchOptions: options, invertCondition: false });

async function main() {
  await U.managementSDKClient({ host: "api.contentstack.io" }); // refreshes the CLI token if needed
  const oauth = U.configHandler.get("oauthAccessToken");
  headers = { "x-project-uid": PROJECT, "Content-Type": "application/json", ...(oauth ? { authorization: `Bearer ${oauth}` } : { authtoken: U.configHandler.get("authtoken") }) };

  const existing = await call("GET", "/audiences");
  const audiences = {};
  for (const [code, country] of MARKETS) {
    const name = `Visitors in ${country}`;
    const found = existing.find((a) => a.name === name);
    audiences[code] =
      found?.uid ??
      (
        await call("POST", "/audiences", {
          name,
          description: `Country is ${code}, or the URL has ?market=${code.toLowerCase()} (demo override).`,
          definition: {
            __type: "RuleCombination",
            combinationType: "OR",
            rules: [
              rule("COUNTRY", "STRING_EQUALS", { __type: "StringMatchOptions", value: code }),
              rule("QUERY_PARAMETERS", "JSON_MATCH", { __type: "JSONMatchOptions", pointer: "/market", matchCondition: "STRING_EQUALS", matchOptions: { __type: "StringMatchOptions", value: code.toLowerCase() }, invertCondition: false }),
            ],
          },
        })
      ).uid;
    console.log(`audience ${name}: ${audiences[code]}`);
  }

  let exp = (await call("GET", "/experiences")).find((e) => e.name === EXPERIENCE);
  if (!exp) exp = await call("POST", "/experiences", { name: EXPERIENCE, description: "Header announcement for the visitor's country (nearest store).", __type: "SEGMENTED" });
  // Keep the variants that already exist (e.g. France, made by hand in the UI) with their short UIDs;
  // new variants go without one so Personalize assigns it.
  const versions = await call("GET", `/experiences/${exp.uid}/versions`);
  const current = versions.find((v) => v.status === "DRAFT") ?? versions.find((v) => v.status === "ACTIVE");
  const kept = (current?.variants ?? []).map(({ __type, name, shortUid, audiences: a, audienceCombinationType }) => ({ __type, name, shortUid, audiences: a, audienceCombinationType }));
  const added = MARKETS.filter(([, country]) => !kept.some((v) => v.name === country)).map(([code, country]) => ({ __type: "SegmentedVariant", name: country, audiences: [audiences[code]], audienceCombinationType: "OR" }));
  if (added.length) {
    const variants = [...kept, ...added];
    if (current?.status === "DRAFT") await call("PUT", `/experiences/${exp.uid}/versions/${current.uid}`, { status: "ACTIVE", variants });
    else await call("POST", `/experiences/${exp.uid}/versions`, { status: "ACTIVE", variants });
    console.log(`added variants: ${added.map((v) => v.name).join(", ")}`);
  }

  // Personalize creates the CMS variant group asynchronously after activation.
  for (let i = 0; i < 10; i++) {
    exp = await call("GET", `/experiences/${exp.uid}`);
    if (exp._cms?.variantGroup) break;
    await new Promise((r) => setTimeout(r, 2000));
  }
  console.log(`experience ${EXPERIENCE}: shortUid ${exp.shortUid}, status ${exp.status}`);
  console.log("CMS:", JSON.stringify(exp._cms));
  await writeHeaderVariants(exp._cms.variants);
}

// Header announcement per country (variant short UID → text per locale).
const ANNOUNCEMENTS = {
  France: {
    "en-us": "Riding from France? Come and see us at The Vak Biarritz and Nice.",
    "fr-fr": "Tu rides en France ? Passe nous voir à Biarritz ou à Nice.",
    "it-it": "Giri in Francia? Passa a trovarci a Biarritz o a Nizza.",
    "es-es": "¿Ruedas en Francia? Ven a vernos a Biarritz o Niza.",
  },
  Netherlands: {
    "en-us": "Riding from the Netherlands? Come and see us at our Amsterdam flagship.",
    "fr-fr": "Tu rides aux Pays-Bas ? Passe nous voir au flagship d'Amsterdam.",
    "it-it": "Giri nei Paesi Bassi? Passa a trovarci al flagship di Amsterdam.",
    "es-es": "¿Ruedas en los Países Bajos? Ven a vernos a nuestra flagship de Ámsterdam.",
  },
  Italy: {
    "en-us": "Riding from Italy? Come and see us at The Vak Milano.",
    "fr-fr": "Tu rides en Italie ? Passe nous voir à The Vak Milano.",
    "it-it": "Giri in Italia? Passa a trovarci a The Vak Milano.",
    "es-es": "¿Ruedas en Italia? Ven a vernos a The Vak Milano.",
  },
  Spain: {
    "en-us": "Riding from Spain? Come and see us at The Vak Barcelona.",
    "fr-fr": "Tu rides en Espagne ? Passe nous voir à The Vak Barcelona.",
    "it-it": "Giri in Spagna? Passa a trovarci a The Vak Barcelona.",
    "es-es": "¿Ruedas en España? Ven a vernos a The Vak Barcelona.",
  },
};

/** Creates or updates the header entry variant of each country in every locale, then publishes it. */
async function writeHeaderVariants(cmsVariants) {
  const apiKey = fs.readFileSync(ENV_FILE, "utf8").match(/^VAK_GROUP_API_KEY=(.+)$/m)[1].trim();
  const cma = async (method, p, body, version) => {
    const h = { ...headers, api_key: apiKey, ...(version ? { api_version: version } : {}) };
    delete h["x-project-uid"];
    const res = await fetch("https://api.contentstack.io/v3" + p, { method, headers: h, body: body && JSON.stringify(body) });
    const json = await res.json();
    if (!res.ok) throw new Error(`${method} ${p} → ${res.status} ${JSON.stringify(json)}`);
    return json;
  };
  const header = (await cma("GET", "/content_types/header/entries?locale=en-us")).entries[0];
  const versions = (await call("GET", `/experiences/${(await call("GET", "/experiences")).find((e) => e.name === EXPERIENCE).uid}/versions`)).find((v) => v.status === "ACTIVE");
  for (const v of versions.variants) {
    const variantUid = cmsVariants[v.shortUid];
    const texts = ANNOUNCEMENTS[v.name];
    if (!variantUid || !texts) continue;
    for (const [locale, announcement] of Object.entries(texts)) {
      const saved = await cma("PUT", `/content_types/header/entries/${header.uid}/variants/${variantUid}?locale=${locale}`, {
        entry: { announcement, _variant: { _change_set: ["announcement"] } },
      });
      await cma("POST", `/content_types/header/entries/${header.uid}/publish`, {
        entry: { environments: ["development"], locales: [locale], variants: [{ uid: variantUid, version: saved.entry._version }] },
        locale,
      }, "3.2");
      console.log(`header variant ${v.name} ${locale}: saved + published`);
    }
  }
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});

// Writes one env file per site for Contentstack Launch (.env.launch.<site>, git-ignored),
// ready to paste into Project → Settings → Environment Variables → "Add in bulk".
//   node scripts/launch-env.cjs                 → public URLs keep their current values
//   node scripts/launch-env.cjs group=https://… surf=https://… skate=https://… snow=https://…
const fs = require("fs");
const path = require("path");
const ROOT = path.join(__dirname, "..");
const local = Object.fromEntries(
  fs.readFileSync(path.join(ROOT, ".env.local"), "utf8").split("\n")
    .filter((l) => /^[A-Z_]+=/.test(l)).map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1).trim()]),
);
const SITES = ["group", "surf", "skate", "snow"];
const urls = Object.fromEntries(SITES.map((s) => [s, local[`NEXT_PUBLIC_${s.toUpperCase()}_URL`]]));
for (const arg of process.argv.slice(2)) {
  const [k, v] = arg.split("=");
  if (SITES.includes(k)) urls[k] = v.replace(/\/$/, "");
}
for (const site of SITES) {
  const S = site.toUpperCase();
  const vars = {
    SITE: site,
    CONTENTSTACK_API_KEY: local[`VAK_${S}_API_KEY`],
    CONTENTSTACK_DELIVERY_TOKEN: local[`VAK_${S}_DELIVERY_TOKEN`],
    CONTENTSTACK_PREVIEW_TOKEN: local[`VAK_${S}_PREVIEW_TOKEN`],
    CONTENTSTACK_ENVIRONMENT: "development",
    CONTENTSTACK_REGION: "us",
    CONTENTSTACK_PERSONALIZE_PROJECT_UID: local[`VAK_${S}_PERSONALIZE_PROJECT_UID`],
    ...Object.fromEntries(SITES.map((s) => [`NEXT_PUBLIC_${s.toUpperCase()}_URL`, urls[s]])),
  };
  const body = Object.entries(vars).filter(([, v]) => v).map(([k, v]) => `${k}=${v}`).join("\n") + "\n";
  fs.writeFileSync(path.join(ROOT, `.env.launch.${site}`), body);
  console.log(`.env.launch.${site}: ${Object.keys(vars).filter((k) => vars[k]).join(", ")}`);
}

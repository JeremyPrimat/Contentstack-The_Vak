// Uploads the photos in assets/photos/ to the right stack, links them to the
// entries listed in scripts/photo-map.cjs, then publishes assets and entries.
//
//   node scripts/upload-photos.cjs --dry-run   # check every target, upload nothing
//   node scripts/upload-photos.cjs             # do it
//
// Uses the csdx OAuth session (MCP has no asset upload tool, FRICTION_LOG row 14).
// Idempotent: a photo already uploaded to a stack (same title in the folder) is reused.
const fs = require("fs");
const path = require("path");
const MAP = require("./photo-map.cjs");

const CLI_UTILS = path.join(process.env.HOME, ".npm-global/lib/node_modules/@contentstack/cli/node_modules/@contentstack/cli-utilities");
const { managementSDKClient, authenticationHandler } = require(CLI_UTILS);

const ROOT = path.join(__dirname, "..");
const PHOTOS = path.join(ROOT, "assets/photos");
const ENV_FILE = path.join(ROOT, ".env.local");
const ENVIRONMENT = "development";
const ALL_LOCALES = ["en-us", "fr-fr", "it-it", "es-es"];
const LOCALES = { GROUP: ALL_LOCALES, SURF: ALL_LOCALES, SKATE: ALL_LOCALES, SNOW: ALL_LOCALES };
const FOLDER = "Photos";
const EXT = [".jpg", ".jpeg", ".png", ".webp", ".svg"];
const LOGOS = path.join(ROOT, "assets/logo");
const DRY = process.argv.includes("--dry-run");
// --only <url>: process only the entries whose URL contains this text.
const ONLY = process.argv.includes("--only") ? process.argv[process.argv.indexOf("--only") + 1] : null;

const apiKey = (site) => {
  const m = fs.readFileSync(ENV_FILE, "utf8").match(new RegExp(`^VAK_${site}_API_KEY=(.+)$`, "m"));
  if (!m) throw new Error(`VAK_${site}_API_KEY missing in .env.local`);
  return m[1].trim();
};

function findFile(names) {
  for (const name of names) {
    for (const dir of [PHOTOS, LOGOS]) {
      for (const ext of EXT) {
        const p = path.join(dir, name + ext);
        if (fs.existsSync(p)) return { name, file: p };
      }
    }
  }
  return null;
}

/** Resolves "sections[story_block#1].image" to [parentObject, key]. */
function resolvePath(entry, p) {
  const parts = p.split(".");
  let node = entry;
  for (let i = 0; i < parts.length; i++) {
    const m = parts[i].match(/^(\w+)(?:\[([^\]]+)\])?$/);
    if (!m) throw new Error(`bad path segment ${parts[i]}`);
    const [, key, sel] = m;
    const last = i === parts.length - 1;
    if (sel === undefined) {
      if (last) return [node, key];
      node = node?.[key];
    } else if (/^\d+$/.test(sel)) {
      node = node?.[key]?.[Number(sel)];
    } else {
      const [block, nth = "0"] = sel.split("#");
      const blocks = (node?.[key] ?? []).filter((b) => b && b[block]);
      node = blocks[Number(nth)]?.[block];
    }
    if (node === undefined || node === null) return null;
  }
  return null;
}

async function main() {
  await authenticationHandler.getAuthDetails();
  const client = await managementSDKClient({ host: "api.contentstack.io" });
  const sites = [...new Set(MAP.map((t) => t.site))];
  const summary = { linked: 0, missingPhoto: [], badTarget: [], notPublished: [] };

  for (const site of sites) {
    const stack = client.stack({ api_key: apiKey(site) });
    const targets = MAP.filter((t) => t.site === site && (!ONLY || (t.url || "").includes(ONLY)));
    const entries = new Map(); // key ct|url → entry
    const assets = new Map(); // photo name → asset uid
    let folderUid;

    for (const t of targets) {
      const key = `${t.ct}|${t.url}`;
      if (!entries.has(key)) {
        // Singletons (header, footer) have no url: take the only entry.
        const query = t.url ? { query: { url: t.url }, locale: "en-us" } : { locale: "en-us" };
        const res = await stack.contentType(t.ct).entry().query(query).find();
        entries.set(key, res.items?.[0] ?? null);
      }
      const entry = entries.get(key);
      const slot = entry && resolvePath(entry, t.path);
      if (!slot) {
        summary.badTarget.push(`${site} ${t.ct} ${t.url} ${t.path}`);
        continue;
      }
      const photos = t.multi ? t.files.map((f) => findFile([f])).filter(Boolean) : [findFile(t.files)].filter(Boolean);
      const photo = photos[0];
      if (!photo) {
        summary.missingPhoto.push(`${site} ${t.ct} ${t.url} → ${t.files[0]} (p${t.priority})`);
        continue;
      }
      if (DRY) {
        console.log(`[dry] ${site} ${t.ct} ${t.url} ${t.path} ← ${photos.map((p) => path.basename(p.file)).join(", ")}`);
        continue;
      }
      for (const ph of photos) {
        if (assets.has(ph.name)) continue;
        folderUid ??= await ensureFolder(stack);
        const found = await stack.asset().query({ query: { parent_uid: folderUid, title: ph.name } }).find();
        let asset = found.items?.[0];
        const localSize = fs.statSync(ph.file).size;
        if (!asset) {
          asset = await stack.asset().create({ upload: ph.file, title: ph.name, tags: [ph.file.endsWith(".svg") ? "logo" : "photo"], parent_uid: folderUid });
          console.log(`${site}: uploaded ${ph.name}`);
        } else if (Number(asset.file_size) !== localSize) {
          // Same slot, new photo: replace the file in place so every entry linking it follows.
          const existing = await stack.asset(asset.uid).fetch();
          asset = await existing.replace({ upload: ph.file, title: ph.name });
          console.log(`${site}: replaced ${ph.name}`);
        }
        await stack.asset(asset.uid).publish({ publishDetails: { environments: [ENVIRONMENT], locales: LOCALES[site] } });
        assets.set(ph.name, asset.uid);
      }
      const [parent, field] = slot;
      parent[field] = t.multi ? photos.map((p) => assets.get(p.name)) : assets.get(photo.name);
      (entry.__writes ??= []).push([t.path, parent[field]]);
      entry.__dirty = true;
      summary.linked++;
    }

    if (!DRY) {
      for (const [key, entry] of entries) {
        if (!entry?.__dirty) continue;
        const writes = entry.__writes;
        delete entry.__dirty;
        delete entry.__writes;
        await entry.update({ locale: "en-us" });
        const ct = key.split("|")[0];
        const localized = await syncLocalized(stack, ct, entry, writes, LOCALES[site]);
        try {
          await stack.contentType(ct).entry(entry.uid).publish({ publishDetails: { environments: [ENVIRONMENT], locales: LOCALES[site] }, locale: "en-us" });
          // Publishing from en-us does not republish localized versions: each publishes from its own locale.
          for (const loc of localized)
            await stack.contentType(ct).entry(entry.uid).publish({ publishDetails: { environments: [ENVIRONMENT], locales: [loc] }, locale: loc });
          console.log(`${site}: updated + published ${ct} ${entry.url}`);
        } catch (e) {
          // e.g. a publish rule waiting on a workflow approval: the entry is saved, a reviewer publishes it.
          summary.notPublished.push(`${site} ${ct} ${entry.url}: ${e.errorMessage || e.message}`);
        }
      }
    }
  }

  console.log(`\n${DRY ? "[dry run] " : ""}linked: ${summary.linked}`);
  if (summary.badTarget.length) console.log(`\nTargets not found:\n  ${summary.badTarget.join("\n  ")}`);
  if (summary.notPublished.length) console.log(`\nSaved but not published (${summary.notPublished.length}):\n  ${summary.notPublished.join("\n  ")}`);
  if (summary.missingPhoto.length) console.log(`\nNo photo yet (${summary.missingPhoto.length}):\n  ${summary.missingPhoto.join("\n  ")}`);
}

async function ensureFolder(stack) {
  const res = await stack.asset().query({ query: { is_dir: true, name: FOLDER } }).find();
  const existing = (res.items || []).find((f) => f.name === FOLDER);
  if (existing) return existing.uid;
  return (await stack.asset().folder().create({ asset: { name: FOLDER } })).uid;
}

main().catch((e) => {
  console.error("ERROR", e.errorMessage || e.message, JSON.stringify(e.errors || ""));
  process.exit(1);
});

// Localized versions keep their own copy of every field, images included, so the
// same photos are written to each fr/it/es version that exists before publishing.
// Product colourways are non-localizable: the whole list is copied from en-us.
async function syncLocalized(stack, ct, master, writes, locales) {
  const localized = [];
  for (const loc of locales.filter((l) => l !== "en-us")) {
    const loc_entry = await stack.contentType(ct).entry(master.uid).fetch({ locale: loc });
    if (loc_entry.locale !== loc) continue; // not localized: it falls back to en-us anyway
    if (ct === "product") loc_entry.colourways = JSON.parse(JSON.stringify(master.colourways));
    else
      for (const [p, value] of writes) {
        const slot = resolvePath(loc_entry, p);
        if (slot) slot[0][slot[1]] = value;
      }
    await loc_entry.update({ locale: loc });
    localized.push(loc);
  }
  return localized;
}

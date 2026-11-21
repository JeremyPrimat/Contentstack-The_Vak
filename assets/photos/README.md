# Photos to drop here

Name each file exactly as below (`.jpg`, `.jpeg`, `.png` or `.webp`), then run:

```bash
node scripts/upload-photos.cjs --dry-run   # shows what goes where
node scripts/upload-photos.cjs             # uploads, links, publishes
```

Mapping lives in `scripts/photo-map.cjs`. P1 = needed for the demo, P2/P3 = nice to have
(a missing P2 slot falls back to a P1 photo where it makes sense).

| File | Used for | Priority |
|---|---|---|
| `the-vak-hero` | Group home, first hero slide | P1 |
| `the-vak-campaign` | Group campaign "Cold Water Season" | P1 |
| `the-vak-story`, `the-vak-repair` | Group home + About story blocks | P2 / P3 |
| `brand-surf`, `brand-skate`, `brand-snow` | Brand hero (group + brand stacks), hero fallback | P1 |
| `store-amsterdam` … `store-barcelona` (+ `store-nice`, `store-milano`), or one `store-generic` | Store cards | P1 |
| `category-wetsuits`, `category-boardshorts`, `category-sneakers`, `category-streetwear`, `category-jackets`, `category-goggles` | Category tiles | P1 |
| `surf-campaign`, `skate-campaign`, `snow-campaign` | Brand campaign banners | P1 |
| `surf-hero-1/2`, `skate-hero-1/2`, `snow-hero-1/2` | Brand home hero slides | P1 / P2 |
| `surf-guide`, `skate-guide`, `snow-guide` | Guide covers | P2 |
| `surf-story`, `skate-story`, `snow-story` | Brand home story block | P3 |

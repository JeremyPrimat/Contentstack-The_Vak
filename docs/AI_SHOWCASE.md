# Polaris et agents on-demand — préparation pour Victor

Fil rouge : **un front froid arrive sur les Alpes**. La donnée le signale (Data Cloud), un agent réagit (Agent OS), le contenu change sous contrôle humain (Content Cloud). Polaris est le point d'entrée : c'est depuis lui qu'on lance les agents et qu'on travaille le contenu.

Avant de montrer : `node scripts/demo-reset.cjs` (remet la home Vak Snow et le guide Polaris dans leur état de départ).

---

## 1. Polaris — 4 temps, ~6 min

Tout se passe dans le stack **Vak Snow**, sur le guide **Layering for a cold front** (brouillon, pas publié, pas traduit). Il a été préparé exprès : le corps est dans la voix Vak Snow, mais **l'intro ne l'est pas** (« ULTIMATE winter adventure!!! »), et il n'a ni extrait, ni SEO, ni produits liés, ni version italienne.

### a. Remettre l'intro dans la voix de la marque (Brand Kit)
Ouvre l'entrée, sélectionne le premier paragraphe, ouvre Polaris (ou l'assistant AI du champ) avec le voice profile **Vak Snow** :

```text
Rewrite this paragraph in the Vak Snow voice: casual, informative, a little self-mockery about being Dutch in the mountains, no exclamation marks, no extreme-sports bravado. Keep it under 45 words.
```
**Ce que tu dis :** « The Brand Kit holds the voice of each brand. Polaris doesn't write generic marketing copy, it writes Vak Snow. And the bravado is gone, because the voice profile says never glorify danger. »

### b. Combler les trous : extrait et SEO
```text
Write an excerpt (max 25 words) and an SEO meta title (max 60 characters) and meta description (max 155 characters) for this guide, in the Vak Snow voice.
```
Colle les résultats dans `excerpt` et `seo`. **Message :** l'IA fait le travail ingrat, l'éditeur garde la décision.

### c. Polaris connaît le catalogue (Knowledge Vault)
```text
Which Vak Snow products should this guide link to, and why? Use the product catalogue.
```
Attendu : Ijs (isolation, -15 °C au télésiège), Polder (shell 20k/20k), Helder ou Mist (VLT, flat light). Ajoute-les dans `related_products`.

### d. Traduire pour le marché italien, puis passer en relecture
Localise l'entrée en **it-it** et lance la traduction Polaris (voice profile Vak Snow). Vérifie : « tu », noms de produits non traduits (Ijs, Polder, Helder), VLT gardé. Passe l'étape de workflow à **AI draft** puis **In review**.
**Message :** « Milano is our snow store. The translation follows the Knowledge Vault rules, and the workflow plus the publish rule make sure a human approves it before it goes live. »

### Bonus : Polaris comme assistant du stack (question, pas rédaction)
```text
In the Vak Snow stack, which articles are not translated into Italian yet, and which entries are still in the Draft workflow stage?
```
Montre que Polaris lit le contenu, pas seulement qu'il écrit.

---

## 2. Agent on-demand n°1 — Vak Demand agent (déjà construit, testé)

**Où :** Agent OS → Agents → *Vak Demand agent* → **Run** (ou dans Polaris : `@vak_demand_agent`).
**Inputs :**
- Trend signal : `Cold front in the Alps this weekend (IT, FR): searches +180% for insulated jackets, +95% for spherical goggles. Push Ijs and Helder.`
- Headline : `Trending in the Alps`

**Déroulé :** Continue → Connect (« Runs as you ») → Execute → l'agent lit la home (Get Single Entry), puis **s'arrête et demande confirmation** avant Update an Entry → déplie *Sections (5)* → **Update** → réponse avec l'ancien et le nouvel ordre.
Puis : ouvre l'entrée → Live Preview → **Publish** → https://vak-snow.contentstackapps.com montre « Trending in the Alps » avec Ijs et Helder en tête (≤ 60 s).

**Les 4 garde-fous à nommer :**
1. **On-demand** : un humain le lance, avec des inputs typés.
2. **Runs as you** : il n'a que les droits de la personne qui le lance.
3. **Confirmation mode** (Manual) : chaque écriture est validée avant d'être exécutée.
4. **Pas d'outil Publish** : il ne peut que créer une version brouillon. La publication reste humaine.

Et la trace : **Executions** garde chaque run (inputs, appels d'outils, réponse).

---

## 3. Agent on-demand n°2 — Vak Campaign agent (à construire, ~10 min)

L'agent n°1 **modifie** une page. Le n°2 **crée** une page : à partir d'un brief, il crée une campagne Vak Snow complète en brouillon (titre, URL, dates, accroche, résumé, produits, CTA, SEO, marchés). Elle s'affiche ensuite sur `vak-snow.contentstackapps.com/campaigns/<slug>`.

**Trigger : On Demand**, 1 input :
- Title `Campaign brief` — Long text si disponible — Required — Instruction : `Who, where, when and what to push. E.g. "Cold front weekend in the Alps for Italian and French riders, 5–8 Dec. Push insulated jackets and flat-light goggles."`

**Tools (CMS, Runs as you, stack Vak Snow) :**
- **Get All Entries** (content type Product) — pour choisir les produits.
- **Create an Entry** (content type Campaign, locale en-us).
- Pas de Publish.

**Instructions :**
```text
You are the Campaign agent of Vak Snow, a brand of The Vak boardsports group. A marketer runs you with a "Campaign brief".

Goal: create a complete campaign entry as a draft, ready for review.

1. Use [/ Get All Entries] to list the Vak Snow products (title, uid, category).
2. Pick 2 or 3 products that match the brief.
3. Use [/ Create an Entry] to create one Campaign entry in locale en-us with:
   - title: short campaign name (max 4 words)
   - url: "/campaigns/" + the title in lowercase with hyphens
   - start_date and end_date: from the brief (YYYY-MM-DD), otherwise the next 7 days
   - eyebrow: "Vak Snow · " + a short context (e.g. "Cold front weekend")
   - headline: max 8 words, Vak Snow voice (casual, informative, a little self-mockery about being Dutch in the mountains, no exclamation marks, never glorify danger)
   - summary: max 25 words, same voice
   - brand: reference to the Vak Snow brand entry (uid blt78962e0bac3e043a)
   - products: the products you picked (content type "product")
   - cta: label "Gear up", link title "Gear up", href "/jackets", style "primary"
   - seo: meta_title "<title> | Vak Snow" (max 60 chars) and meta_description (max 155 chars)
   - taxonomies: activity "snow", and market terms "it", "fr", "es" or "nl" that match the brief
   Leave hero_image empty: a designer picks the photo.
4. Do not publish.
5. Reply with: the campaign title, URL, dates, products and why, and "Draft created, waiting for review".
```

**Test :** brief `Cold front weekend in the Alps for Italian and French riders, 5–8 December. Push insulated jackets and flat-light goggles.` → vérifier l'entrée dans Vak Snow → ajouter une image → Preview → Publish → `/campaigns/<slug>`.

**Ce que tu dis :** « Two agents, two patterns: one edits what exists, one creates something new. Same guardrails: launched on demand, runs as the user, confirms before writing, never publishes. The marketer stays the editor-in-chief. »

---

## 4. La phrase AXP

> « Contentstack isn't just a CMS any more. Content Cloud holds the content and the experiences, Data Cloud knows the visitor (Personalize today, Lytics as the CDP), and Agent OS lets agents act on both, with Polaris as the front door. What you saw is one loop: a signal in the data, an agent that acts, content that changes under human control. »

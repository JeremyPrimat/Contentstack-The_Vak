# Polaris et agents on-demand — préparation pour Victor

Fil rouge : **un front froid arrive sur les Alpes**. La donnée le signale (Data Cloud), des agents réagissent (Agent OS), le contenu change sous contrôle humain (Content Cloud). **Polaris est la porte d'entrée** : c'est lui qui écrit, traduit, lance les agents… et construit même les agents.

**Tout ce qui suit a été testé le 28/11 (nuit) sur la vraie plateforme.** Avant de montrer : `node scripts/demo-reset.cjs` (remet la home Vak Snow, le guide Polaris et supprime les campagnes brouillon créées par l'agent).

---

## 1. Polaris sur un contenu — ~5 min (testé ✅)

Stack **Vak Snow** → Entries → Article **Layering for a cold front** (brouillon). Préparé exprès : corps dans la voix Vak Snow, mais **intro hors ton** (« ULTIMATE winter adventure!!! »), ni extrait, ni SEO, ni produits liés, ni version italienne. Ouvre Polaris (icône ✦ en haut) : il prend l'entrée comme contexte.

### a. Remettre l'intro dans la voix de la marque
```text
Rewrite the first paragraph of this guide's body in the Vak Snow voice from the Brand Kit: casual, informative, a little self-mockery about being Dutch in the mountains, no exclamation marks, no extreme-sports bravado. Keep it under 45 words. Show me the new paragraph only, don't change the entry.
```
**Ce qui se passe :** Polaris affiche « Listed Brand Kits », « Listed Voice Profiles » (il va chercher la voix tout seul), puis : *« A cold front is coming, so pack three layers: a base layer, something warm, and a shell for wind and snow. We are Dutch in the mountains, so staying warm is less about heroics and more about bringing the right jacket. »*
**Ce que tu dis :** « The Brand Kit holds the voice of each brand. Polaris doesn't write generic marketing copy, it writes Vak Snow, and the bravado is gone because the voice profile says never glorify danger. »

### b. Polaris connaît le catalogue
```text
Which Vak Snow products should this guide link to in Related products, and why? Look at the product entries of this stack.
```
**Résultat testé :** Polder 3L (shell 20k/20k, coutures étanchées), Ijs (isolation synthétique), Mist (lentille rosée, flat light) — et il **écarte Helder** en expliquant pourquoi (son atout est le changement de lentille, pas la lentille chaude). Liens cliquables vers les entrées.

### c. Polaris écrit dans l'entrée — avec confirmation
```text
Fill this entry's Excerpt (max 25 words) and its SEO meta title (max 60 characters) and meta description (max 155 characters), in the Vak Snow voice. Also add those three products to Related products. Don't publish.
```
**Ce qui se passe :** Polaris lit le content type, prépare la mise à jour et **affiche une carte « Update this entry? »** avec l'extrait, les 3 produits et le SEO → **Update** → « Entry updated », il vérifie et confirme que l'entrée reste non publiée.
**Message :** même garde-fou que les agents : l'IA propose, l'humain valide.

### d. Traduire pour Milano
```text
Translate this guide into Italian (it-it) for our Milano store, following the Brand Kit translation rules, and save it as the it-it version of this entry. Don't publish.
```
**Résultat testé :** carte « Localize this entry? » → **Confirm** → version it-it créée : *« Stratificare per un fronte freddo »*, tutoiement (« Sei olandese »), « maschere » pour goggles, VLT et noms de produits gardés, structure titres/paragraphes conservée. (L'aperçu de la carte colle les paragraphes, le résultat est propre.)
Puis montre le workflow : l'article est en **Draft** ; il ne peut être publié qu'à l'étape **Approved** (publish rule Vak Snow, créée cette nuit, identique à Vak Surf).

---

## 2. Agent n°1 — Vak Demand agent (testé ✅)

**Modifie** une page existante. Agent OS → Agents → *Vak Demand agent* → **Run** (ou `@vak_demand_agent` dans Polaris).
- Trend signal : `Cold front in the Alps this weekend (IT, FR): searches +180% for insulated jackets, +95% for spherical goggles. Push Ijs and Helder.`
- Headline : `Trending in the Alps`

Continue → Connect (« Runs as you ») → Execute → lit la home → **s'arrête avant Update an Entry** → déplie *Sections (5)* → **Update** → réponse avec ancien/nouvel ordre. Puis entrée → Live Preview → **Publish** → https://vak-snow.contentstackapps.com montre « Trending in the Alps », Ijs et Helder en tête (≤ 60 s).

---

## 3. Agent n°2 — Vak Campaign Builder (construit et testé cette nuit ✅)

**Crée** une page. Et surtout : **il a été construit par Polaris à partir d'une description**. C'est le moment fort à montrer.

### Comment il a été créé (à raconter, ou à refaire en live : ~3 min)
Agent OS → Dashboard → **+ Create → New Agent** → zone « What do you want your agent to do? » :
```text
On demand, a marketer gives a campaign brief. The agent lists the Vak Snow products in the CMS (stack Vak Snow), picks 2 or 3 that match the brief, and creates one new Campaign entry as a draft in en-us: title, url /campaigns/<slug>, start and end dates, eyebrow, headline and summary in the Vak Snow voice, the picked products, the Vak Snow brand, a "Gear up" call to action, SEO fields and market taxonomies. It never publishes and replies with a short summary for human review.
```
→ **Create Agent** → Polaris lit les actions disponibles et propose l'agent complet : **trigger On Demand**, **5 tools** (Get All Content Types, Get All Entries by Content Type, Create an Entry, **Brand Kit : Get All Voice Profiles**, Get All Terms across All Taxonomies), des instructions en étapes reliées aux tools, **pas d'outil Publish** → **Update**.
Ensuite, à la main : input `Campaign brief` sur le trigger, stack **Vak Snow** sur un tool (un toast propose « Apply to 3 tools » → oui), Brand Kit **The Vak**, et quelques précisions dans les instructions (format d'URL, uid de la marque, CTA, image laissée au designer). Save → Publish.

**Ce que tu dis :** « I described the agent in one paragraph, and Polaris built it: trigger, tools, instructions, even the Brand Kit lookup for the voice. I only tightened the details. »

### Le run (testé)
Agent → **Run** → Polaris `@vak_campaign_builder` → Campaign brief :
```text
Cold front weekend in the Alps for Italian and French riders, 5 to 8 December 2026. Push insulated jackets and flat-light goggles.
```
Continue → Connect (5 tools « Ready, Runs as you ») → Execute → l'agent lit les content types, les produits, la voix Vak Snow, les taxonomies (un appel échoue, il se corrige tout seul) → **carte « Create this entry? »** → Create.
**Résultat testé** (entrée `Cold Front Alps Weekend`, non publiée) :
- URL `/campaigns/cold-front-alps-weekend`, du 5 au 8 décembre 2026
- Headline *« Insulated layers for grey days »*
- Summary *« Italian and French riders, pack warmth and a flat-light lens for 5–8 Dec. From a Dutch van perspective, it's basic survival, not heroics. »*
- Produits Ijs, Mist, Helder · marque Vak Snow · CTA Gear up → /jackets · SEO · marchés IT + FR, activité snow
- Pas d'image : le designer la choisit.

Ensuite (humain) : ajoute une image (ex. `snow-campaign`), Preview, Publish → `vak-snow.contentstackapps.com/campaigns/cold-front-alps-weekend`.

⚠️ L'URL est unique : avant de relancer l'agent avec le même brief, `node scripts/demo-reset.cjs` supprime la campagne brouillon.

---

## 4. Les garde-fous, en une phrase chacun

1. **On demand** : un humain lance l'agent, avec des inputs typés.
2. **Runs as you** : l'agent n'a que les droits de la personne qui le lance.
3. **Confirmation (mode Manual)** : chaque écriture s'affiche avant d'être exécutée.
4. **Pas d'outil Publish** + **workflow et publish rule** : la mise en ligne reste humaine.
5. **Executions** : chaque run est tracé (inputs, appels d'outils, réponse).

## 5. La phrase AXP

> « Contentstack isn't just a CMS any more. Content Cloud holds the content and the experiences, Data Cloud knows the visitor (Personalize today, Lytics as the CDP), and Agent OS lets agents act on both, with Polaris as the front door. What you saw is one loop: a signal in the data, agents that act, content that changes under human control. »

## Astuces découvertes

- Dans les instructions d'un agent, « / » ouvre un menu avec deux onglets : **Tools** et **On Demand Inputs** (on peut insérer l'input `Campaign brief` comme une puce, comme un tool).
- Pour choisir un stack sous « Running user's session », il faut passer par **Add custom data** → une fenêtre « Lookup Data from Contentstack » liste les stacks.

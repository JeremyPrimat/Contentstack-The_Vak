# The Vak on Contentstack AXP — full demo script

Reading guide: **▶** = what you click · *italics* = what you say (in your own words, don't read it) · 💡 = point to land · 🛟 = fallback.
Target: **25 minutes** + questions. One-page version: `docs/DEMO_SCRIPT_SHORT.md`.

---

## Before the call (15 min)

1. `node scripts/demo-reset.cjs` → Vak Snow home back to "Best sellers", Polaris guide back to its draft.
2. Browser, **private window** (no Personalize cookies), tabs in this order:
   1. https://the-vak.contentstackapps.com
   2. https://the-vak.contentstackapps.com/lp/first-snow
   3. https://vak-snow.contentstackapps.com
   4. Contentstack → stack **Vak Snow** → entry *Vak Snow home* (Visual Builder)
   5. Contentstack → **Studio** → project → template *Landing page*
   6. Personalize → project → experiences list
   7. Lytics (Contentstack) → project *The Vak* → Dashboard
   8. Agent OS → Agents → *Vak Demand agent*
   9. Contentstack → stack **Vak Snow** → article *Layering for a cold front*
   10. Launch → the four projects
3. Warm up once: open each site page, so nothing is cold-starting during the demo.
4. Zoom the browser to 110–125 %. Close Slack/notifications.

---

## 0. Hook — 1 min

▶ Tab 1, the group home.

*"This is The Vak, a fictional boardsports group born in Amsterdam: three brands, Vak Surf, Vak Skate and Vak Snow, four markets, the Netherlands, France, Italy and Spain, and four languages. Everything you'll see is live, built on a Contentstack trial."*

*"I'll show it the way Contentstack talks about itself now: AXP, the Agentic Experience Platform. Content Cloud, Data Cloud, Agent OS. And I'll follow one story: a cold front is coming to the Alps, and we want to react."*

💡 Name the three pillars up front; you'll tick them off one by one.

---

## 1. Content Cloud — the site factory — 3 min

▶ Open the four sites quickly (group, Surf, Skate, Snow). ▶ Launch tab: four projects.

*"Four sites, one Next.js codebase. Each brand has its own stack, so each brand team owns its content, but they all share the same content model: global fields for SEO and calls to action, taxonomies for activity, gender and market, the same content types. A new brand is a stack clone plus one environment variable on Launch, not a new project."*

*"Markets and languages are separate on purpose: market is a taxonomy, language is a locale. The Netherlands is a market served in English."*

▶ Change the language on the group site (FR → IT).

💡 Partner angle: *"This is the pattern I'd bring to a multi-brand client: a factory, not four builds."*

🛟 If a site is slow: it's ISR, refresh once.

---

## 2. Content Cloud — editing for marketers — 4 min

### Visual Builder + block previews (2 min)
▶ Tab 4, *Vak Snow home* in Visual Builder. Click the hero headline, change a word, show the preview update. Undo.
▶ Click **Add block** between two sections: the menu shows **preview images and categories** (Heroes and campaigns / Products and categories / Brand and stores).

*"Editors edit on the page itself. And when they add a block, they pick it from pictures of the real block, not from a list of names."*

### Studio (2 min)
▶ Tab 2, `/lp/first-snow` on the site. ▶ Tab 5, Studio: the template connected to the *Landing page* content type, the Vak components on the left (hero, promo banner, story, card section).

*"Studio is the newest piece. Developers register the brand's components once: same markup, same CSS as the site. Marketers compose landing pages with them, bound to CMS fields. Every landing page entry gets its URL from the template. No developer in the loop for a new campaign page."*

💡 *"The site header and footer stay around Studio pages, and Personalize still works on them. You'll see that in a minute."*

---

## 3. Data Cloud — geographic personalization — 2 min

▶ Tab 1. Point at the announcement bar: *"Riding from France? Come and see us at The Vak Biarritz and Nice."*
▶ Add `?market=it` → Milano. ▶ Tab 2: `/lp/first-snow?market=es` → Barcelona.

*"Personalize matches visitors by country, from their IP, at the edge. I'm in France, so I get Biarritz and Nice. The `?market=` parameter lets me show the other countries without a VPN: it's an override in the audience itself."*

*"The announcement is a variant of the header entry, so it follows the visitor on every page and in every language, including the Studio page."*

💡 One experience, four audiences, sixteen variants (4 countries × 4 languages), and none of it is code.

🛟 If geo shows nothing: `?market=fr`.

---

## 4. Data Cloud — behavioral personalization — 2 min

▶ Group home: hero starts with *"Three boards. One crew."*
▶ Scroll to the brand cards → **Vak Snow → Our story** (`/brands/vak-snow`), back to the home, **Our story** again, back to the home → hero now starts with ***"Flat country, steep ambitions."*** (Vak Snow).

*"Each visit to a brand page raises an engagement score, a Personalize attribute. From the second visit, this visitor is a 'Snow rider', and the home leads with Snow. Clicking through to a brand site does it in one step."*

*"In production, that score would come from Lytics, our CDP. I'd love to show Lytics audiences doing this, but my trial won't let me into the Lytics audience builder, so for today the front end computes a simple counter and sends it to Personalize. Same mechanism, simpler data source."*

🛟 If the hero doesn't switch: add `?affinity=snow`.

---

## 5. Data Cloud — Lytics — 1 min

▶ Tab 7, Lytics dashboard: events arriving. ▶ Tab 6, Personalize: open an audience picker → the **Lytics audiences** (Highly Engaged, Currently Engaged…) are already listed.

*"The Lytics tag is on all four sites and the project is connected to the stack, Launch and Personalize. The Lytics audiences already show up inside Personalize. That's the bridge between the CDP and the experience."*

💡 Keep it short: it's context for the Data Cloud story, not a feature tour.

---

## 6. Agent OS — the Demand agent — 5 min

*"Now the cold front. Our trend tool says: snow in the Alps this weekend, searches for insulated jackets up 180% in Italy and France. Normally that's an email, a ticket, and the home page changes on Monday. Here's how it works with an agent."*

▶ Tab 3, Vak Snow site: *Best sellers* carousel, Polder first.
▶ Tab 8, Agent OS: show the agent: **Trigger On Demand** (2 inputs), **Tools** Get Single Entry + Update an Entry, **Instructions**.

*"Three things define an agent: when it runs, what it can touch, and how it should think. Notice what's missing: there's no publish tool."*

▶ **Run** → Polaris opens with `@vak_demand_agent` → fill the inputs:
- Trend signal: `Cold front in the Alps this weekend (IT, FR): searches +180% for insulated jackets, +95% for spherical goggles. Push Ijs and Helder.`
- Headline: `Trending in the Alps`

▶ Continue → **Connect**: *"Runs as you: it only has my permissions."* → **Execute**.
▶ It reads the page, then **stops and asks for confirmation** before *Update an Entry*. Expand **Sections (5)**: *"All five blocks are there; it only touches the carousel."* → **Update**.
▶ Read the answer: old order, new order, *"Waiting for human review before publishing."*
▶ Open the entry → Live Preview → **Publish** → Tab 3, refresh (≤ 60 s): *Trending in the Alps*, Ijs and Helder first.

*"Four guardrails: a human launches it, it runs with my rights, it asks before it writes, and it can't publish. And every run is logged in Executions."*

💡 Expected result if you need to describe it: carousel heading "Trending in the Alps", order Ijs → Helder → Polder → Mist, a new unpublished version of the home, other blocks unchanged.

🛟 If the agent fails: open **Executions** to show the trace, and say what it does. Then publish nothing and move on.

---

## 7. Polaris — working on content — 4 min

*"The agent changed what we sell. Now the content around it. Here's a guide a junior writer drafted for the cold front."*

▶ Tab 9, *Layering for a cold front* (draft). Read the first line out loud: *"Get ready for the ULTIMATE winter adventure!!!"* (smile).

1. Select the intro → Polaris, voice profile **Vak Snow**:
   `Rewrite this paragraph in the Vak Snow voice: casual, informative, a little self-mockery about being Dutch in the mountains, no exclamation marks, no extreme-sports bravado. Keep it under 45 words.`
   *"The Brand Kit holds each brand's voice. Polaris writes Vak Snow, not generic marketing."*
2. `Write an excerpt (max 25 words) and an SEO meta title (max 60 characters) and meta description (max 155 characters) for this guide, in the Vak Snow voice.`
3. `Which Vak Snow products should this guide link to, and why? Use the product catalogue.` → link Ijs, Polder, Helder.
4. Localize to **it-it** → Polaris translation → show: informal "tu", product names untouched, VLT kept. Move the workflow to **AI draft → In review**.
   *"The Knowledge Vault holds the translation rules. And the Review workflow with its publish rule means nothing goes live without approval."*

▶ Optional, if time: Vak Surf → *Choose a winter wetsuit* in fr-fr: the same flow, already **Approved** and live at `/fr/guides/choose-a-winter-wetsuit`.

🛟 If Polaris is slow, run step 1 only and show the Surf guide as the finished example.

---

## 8. Partner angle — 2 min

*"A word on how this was built, because that's the job I'm applying for. I built it AI-first: Claude Code with the Contentstack MCP server for the content model and seed content, the CLI and the Management API for what MCP can't do yet (assets, locales, Personalize), and idempotent scripts, so every step can be replayed on a new client stack."*

*"And I kept a friction log: thirty-one points, each with time lost and what Contentstack could improve for partners. A few examples: the CLI stack clone drops taxonomies silently, entry variants publish silently without the 3.2 API version, and the audience builder's 'has no value' operator was saved as a double negation."*

💡 This is your differentiator: you used the product like a partner would, and you can feed it back to the product team.

---

## 9. Close — 1 min

*"Content Cloud holds the content, Data Cloud knows the visitor, Agent OS acts on both, and Polaris is how people talk to it. What you saw is one loop: a signal in the data, an agent that acts, a human who decides, and a live change, in four markets. That's what I'd help partners build."*

---

## Questions you may get

- **Why one stack per brand?** Ownership, permissions and release pace per brand team; the shared model keeps one front end. The trade-off is content shared across brands (stores): it lives in the group stack.
- **Why not entry variants for everything?** Variants are great for overrides (hero order, announcement). Reordering modular blocks in a variant didn't take effect on the CDA (friction log row 24), so the hero variant reorders slides inside the block.
- **How is caching handled with personalization?** The proxy resolves the variant at the edge and rewrites to a variant-specific path, so ISR caches one copy per variant.
- **What would you do with Lytics in production?** Replace the front-end counter with Lytics behavioral scores and content affinity; Personalize audiences reference Lytics audiences directly.
- **How do you stop an agent going rogue?** On-demand trigger, runs as the user, confirmation mode, no publish tool, workflow and publish rules, and the Executions log.
- **What would you build next?** An event-driven QA agent (on entry update: brand voice and SEO check), a Campaign agent that creates pages from a brief, and Automate to revalidate Launch on publish.

---

## Reset after a rehearsal

`node scripts/demo-reset.cjs` · close the private window (clears `vak_*_views` and Personalize cookies).

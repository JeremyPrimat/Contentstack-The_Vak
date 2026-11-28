# The Vak on Contentstack AXP — demo outline (one page)

**Story:** The Vak, a boardsports group from Amsterdam. 3 brands (Surf, Skate, Snow), 4 markets (NL, FR, IT, ES), 4 languages. **One loop:** a signal in the data → an agent acts → content changes under human control.
**AXP = Content Cloud + Data Cloud + Agent OS**, with Polaris as the front door. Not "just a CMS".

| # | Part | Time | Show | Key line |
|---|------|------|------|----------|
| 0 | Hook | 1′ | the-vak home | "One platform runs four sites, four languages, three brands, and now agents." |
| 1 | **Content Cloud** — site factory | 3′ | 4 Launch sites, 1 codebase, 4 stacks | "One codebase, one content model, one stack per brand. A new brand is a clone, not a project." |
| 2 | Content Cloud — editing | 4′ | Visual Builder on the Snow home, block previews, Studio `/lp/first-snow` | "Developers build components once, marketers compose pages without a ticket." |
| 3 | **Data Cloud** — geo | 2′ | `/?market=it`, `/lp/first-snow?market=es` | "Same page, the announcement follows the country. Real visitors are matched by IP." |
| 4 | Data Cloud — behaviour | 2′ | Vak Snow card → *Our story* twice → home leads with Snow | "Engagement, not a form, decides the hero. In production this score comes from Lytics." |
| 5 | Data Cloud — Lytics | 1′ | Lytics project, events, Lytics audiences inside Personalize | "Connected and collecting; my trial blocks the audience builder, so the counter stands in." |
| 6 | **Agent OS** — Demand agent | 5′ | Polaris → `@vak_demand_agent` → confirm → Live Preview → Publish → Snow site | "Launched on demand, runs as me, asks before writing, can't publish." |
| 6b | Agent OS — Campaign Builder | 3′ | Agent built by Polaris from one paragraph → run a brief → draft campaign | "One agent edits, one creates, and Polaris built the second one." |
| 7 | **Polaris** — content work | 4′ | Guide *Layering for a cold front*: voice rewrite, products, excerpt + SEO written in the entry, it-it, workflow | "Brand Kit voice, Knowledge Vault facts, human approval before anything goes live." |
| 8 | Partner angle | 2′ | MCP + CLI + scripts, FRICTION_LOG (35 rows) | "Built AI-first with Claude Code and the Contentstack MCP, and here's what I'd fix for partners." |
| 9 | Close | 1′ | — | AXP sentence below. |

**Total ≈ 28 min.** If short on time: drop 2 (keep Studio only), 5, 6b and 8.

**Closing sentence:**
> "Content Cloud holds the content, Data Cloud knows the visitor, Agent OS acts on both, and Polaris is how people talk to it. What you saw is one loop: a signal, an agent, a human decision, a live change, in four markets."

**Before you start:** `node scripts/demo-reset.cjs` · private window for the site · tabs ready (see full script) · Agent OS open on *Vak Demand agent*.

**If something breaks:** agent → show **Executions** + the expected result in the full script · Personalize → use `?affinity=snow` · Polaris slow → move on to the agent, come back.

# Contributor and Agent Instructions

Before making product, UX, or implementation changes, read `README.md` and the relevant canonical documents under `docs/product`, `docs/ux`, `docs/architecture`, and `docs/ROADMAP.md`.

## Non-negotiable operating rules

1. Preserve **the Day** as the primary user mental model: recording life must be easier than categorizing it.
2. Preserve the **Campus Atelier** direction and its Desk → Notebook → Paper intensity model. Avoid generic SaaS dashboards, scrapbook maximalism, and decoration without meaning.
3. Treat privacy, per-user isolation, deletion/export, and offline/local-friendly behavior as architectural requirements—not later polish. Never claim security or encryption properties that are not implemented and verified.
4. Keep AI optional, transparent, and unnecessary for basic journaling. Do not assume an AI provider or broad consent to process personal content.
5. Never introduce streaks, guilt, productivity scoring, XP, currencies, or other gamification mechanics. Sparse days and skipped reflections are valid.
6. Implement authorized features deeply, including relevant persistence, responsive states, failures, offline behavior, keyboard use, accessibility, reduced motion, privacy boundaries, tests, maintainability, and polish. Do not substitute superficial placeholders for working behavior.
7. Preserve existing working features and unrelated user work unless explicitly instructed otherwise.
8. Add or update tests for meaningful behavior changes. Report the exact verification commands and results, and explicitly disclose anything that could not be verified.
9. Introduce dependencies only with clear, documented justification. Do not make premature stack choices.
10. Record meaningful architecture decisions in `docs/architecture/DECISION_LOG.md` and keep affected source-of-truth documents consistent.
11. Before handing off implementation work, run the relevant commands documented in `README.md`; database policy verification is not interchangeable with application unit tests.

If an instruction conflicts with the canonical product direction, pause and surface the conflict rather than silently redefining the product.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

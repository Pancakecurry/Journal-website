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

If an instruction conflicts with the canonical product direction, pause and surface the conflict rather than silently redefining the product.

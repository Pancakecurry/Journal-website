# Product Roadmap

This roadmap expresses intended sequencing, not immutable numbering. Later evidence or architecture decisions may insert, split, merge, or reorder work, provided dependencies and canonical documentation are updated deliberately.

## Definition of done for future implementation tasks

Applicable feature work should normally address:

- Functional correctness and robust persistence
- Mobile and desktop behavior
- Empty, loading, failure, and recovery states
- Offline behavior and sync implications where applicable
- Keyboard use and accessibility
- Reduced motion
- Privacy and data boundaries
- Automated and manual tests
- Maintainability and meaningful documentation
- Visual polish consistent with Campus Atelier

Features should be delivered as deep, coherent slices rather than superficial placeholders. Each implementation report should state exact verification commands and results and disclose anything not verified.

## Stage A — Definition and foundation

| Task | Outcome |
| --- | --- |
| 000 | Product and UX source of truth |
| 001 | Technical architecture and stack decision |
| 002 | Repository and engineering foundation |
| 003 | Campus Atelier design-system foundation |
| 004 | App shell and navigation |
| 005 | Local-first data foundation |
| 006 | Identity, privacy, and sync foundation |

## Stage B — The ordinary Day MVP

| Task | Outcome |
| --- | --- |
| 007 | Today |
| 008 | Quick Capture |
| 009 | Images and media |
| 010 | Journal writing |
| 011 | Morning check-in |
| 012 | Evening wrap-up |
| 013 | Historical day |
| 014 | Calendar |
| 015 | Journal library |
| 016 | Search |
| 017 | Backfilling and editing history |

This stage must prove that recording and revisiting one ordinary day feels unusually enjoyable. MVP scope and acceptance boundaries are defined in [MVP Scope](product/MVP_SCOPE.md).

## Stage C — Personal notation and reflection

| Task | Outcome |
| --- | --- |
| 018 | Tracker foundation |
| 019 | Tracker visualization |
| 020 | Monthly recap |
| 021 | Personalization |

Trackers remain open-ended, notebook-like, and non-judgmental. Recaps and personalization reflect authored history rather than productivity or engagement scores.

## Stage D — My World and play

| Task | Outcome |
| --- | --- |
| 022 | My World |
| 023 | Keepsakes |
| 024 | Doodle system |
| 025 | Mini-game framework |
| 026 | Initial mini-games |

Play stays inside My World, does not compete with journaling, and should produce meaningful journal artifacts where possible. No unlock economy.

## Stage E — Memory and optional intelligence

| Task | Outcome |
| --- | --- |
| 027 | Memory resurfacing |
| 028 | Semantic memory |
| 029 | Optional journal assistant |
| 030 | AI privacy controls |

Core journaling remains fully useful without AI. AI-related work requires transparent processing boundaries and meaningful user control before broad access to private content.

## Stage F — Ownership, hardening, and delivery

| Task | Outcome |
| --- | --- |
| 031 | Export and data ownership |
| 032 | Accessibility hardening |
| 033 | Performance hardening |
| 034 | Security review |
| 035 | PWA and installability |
| 036 | Native packaging evaluation |
| 037 | Beta |
| 038 | Final polish |

Hardening tasks deepen continuous responsibilities; they do not defer accessibility, performance, privacy, security, or ownership considerations from earlier feature work.

## Current gate

Task 000 defines the product. The next recommended task is **Task 001 — Technical Architecture & Stack Decision**, which must not begin without separate authorization.

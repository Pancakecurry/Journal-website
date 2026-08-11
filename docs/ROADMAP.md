# Product Roadmap

This roadmap groups the original detailed Task 000–038 sequence into six major implementation phases. The granular milestones remain authoritative planning units. Later evidence may insert, split, merge, or reorder tasks when dependencies and canonical documentation are updated deliberately.

## Definition of done for implementation work

Applicable feature work should normally address functional correctness, persistence, mobile and desktop behavior, empty/loading/failure/recovery states, offline and sync implications, keyboard accessibility, reduced motion, privacy boundaries, tests, maintainability, documentation, and Campus Atelier visual polish.

Features should be deep coherent slices, not superficial placeholders. Every implementation report states exact verification commands/results and discloses anything not verified.

## Product constitution

| Task | Outcome                        | Status   |
| ---- | ------------------------------ | -------- |
| 000  | Product and UX source of truth | Complete |

## Phase 1 — Architecture & Foundation

Tasks 001–006 establish the durable technical base without building the complete journal experience.

| Task | Outcome                                   | Status                                                                          |
| ---- | ----------------------------------------- | ------------------------------------------------------------------------------- |
| 001  | Technical architecture and stack decision | Complete                                                                        |
| 002  | Repository and engineering foundation     | Complete                                                                        |
| 003  | Campus Atelier design-system foundation   | Complete                                                                        |
| 004  | App shell and navigation                  | Complete                                                                        |
| 005  | Local-first data foundation               | Complete                                                                        |
| 006  | Identity, privacy, and sync foundation    | Foundation implemented; live project configuration remains environment-specific |

## Phase 2 — Daily Journal Experience

Tasks 007–013 prove that recording one ordinary day feels unusually enjoyable.

| Task | Outcome          |
| ---- | ---------------- |
| 007  | Today            |
| 008  | Quick Capture    |
| 009  | Images and media |
| 010  | Journal writing  |
| 011  | Morning check-in |
| 012  | Evening wrap-up  |
| 013  | Historical day   |

MVP scope and acceptance boundaries are defined in [MVP Scope](product/MVP_SCOPE.md).

## Phase 3 — Personal History & Organization

| Task | Outcome                         |
| ---- | ------------------------------- |
| 014  | Calendar                        |
| 015  | Journal library                 |
| 016  | Search                          |
| 017  | Backfilling and editing history |
| 018  | Tracker foundation              |
| 019  | Tracker visualization           |
| 020  | Monthly recap                   |

Trackers remain open-ended, notebook-like, and non-judgmental. Calendar and recaps communicate that something lives on a Day, not that it was productive.

## Phase 4 — Personal World

| Task | Outcome             |
| ---- | ------------------- |
| 021  | Personalization     |
| 022  | My World            |
| 023  | Keepsakes           |
| 024  | Doodle system       |
| 025  | Mini-game framework |
| 026  | Initial mini-games  |
| 027  | Memory resurfacing  |

Personality emerges from authorship and accumulated use. Play stays inside My World, creates meaningful artifacts when possible, and never introduces an unlock economy.

## Phase 5 — Intelligence, Privacy & Hardening

| Task | Outcome                    |
| ---- | -------------------------- |
| 028  | Semantic memory            |
| 029  | Optional journal assistant |
| 030  | AI privacy controls        |
| 031  | Export and data ownership  |
| 032  | Accessibility hardening    |
| 033  | Performance hardening      |
| 034  | Security review            |

Core journaling remains fully useful without AI. AI work requires transparent processing boundaries and meaningful user control before access to private content.

## Phase 6 — Installability & Release Polish

| Task | Outcome                     |
| ---- | --------------------------- |
| 035  | PWA and installability      |
| 036  | Native packaging evaluation |
| 037  | Beta                        |
| 038  | Final polish                |

Hardening tasks deepen continuous responsibilities; they do not defer accessibility, performance, privacy, security, or ownership from earlier work.

## Current gate

The next recommended work is **Phase 2 — The Daily Journal Experience**. It must not begin without separate authorization.

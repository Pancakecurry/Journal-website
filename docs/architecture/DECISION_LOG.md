# Architecture Decision Log

## Purpose

This log is the durable index of major technical decisions. Product and UX direction is defined elsewhere; architecture decisions must enable that direction, especially the Day-centered model, privacy, offline/local-friendly core, accessibility, and maintainability.

Task 000 intentionally made no stack decisions. Phase 1 accepted the decisions indexed below after evaluating the product's offline, privacy, longevity, accessibility, and delivery requirements.

## Decision status

| Area | Status | Decision |
| --- | --- | --- |
| Frontend framework | Accepted | Next.js App Router with React and strict TypeScript ([ADR-001](adr/001-application-architecture.md)) |
| Runtime | Accepted | Node.js LTS-compatible runtime; browser client for local-first operations ([ADR-001](adr/001-application-architecture.md)) |
| Primary database | Accepted | Supabase-managed PostgreSQL with RLS ([ADR-003](adr/003-cloud-data-and-auth.md)) |
| Local database/storage | Accepted | IndexedDB through Dexie, versioned locally ([ADR-002](adr/002-local-persistence.md)) |
| Server architecture | Accepted | Next.js server boundaries plus Supabase Data API protected by RLS ([ADR-003](adr/003-cloud-data-and-auth.md)) |
| Authentication | Accepted | Supabase Auth with cookie-based SSR integration ([ADR-003](adr/003-cloud-data-and-auth.md)) |
| File/media storage | Accepted | Local IndexedDB blobs pending upload; private Supabase Storage remotely ([ADR-004](adr/004-private-media.md)) |
| Sync mechanism | Accepted | Client outbox, stable IDs, idempotent versioned mutations, pull cursor ([ADR-005](adr/005-synchronization.md)) |
| Conflict strategy | Accepted | Preserve both ambiguous revisions; no silent last-writer data loss ([ADR-005](adr/005-synchronization.md)) |
| Deployment provider | Recommended | Vercel for Next.js plus Supabase; architecture remains portable ([ADR-009](adr/009-deployment-and-packaging.md)) |
| PWA technology | Direction accepted | Web manifest now; service-worker application shell in Task 035 ([ADR-009](adr/009-deployment-and-packaging.md)) |
| Native wrapper | Deferred | Preserve Capacitor/Tauri evaluation path; do not select yet ([ADR-009](adr/009-deployment-and-packaging.md)) |
| AI provider | Undecided | Deferred; AI is optional and post-MVP |
| Encryption approach | Undecided | Requires explicit threat model and verified design |

“Undecided” is deliberate. Product aspirations—private data, secure authentication, offline use, export, backups, app locking, and transparent AI consent—are requirements to design for, not evidence that a mechanism already exists.

## Record format

Add one entry for each meaningful decision. Small implementation details need not become ADRs unless they create lasting constraints.

```text
## ADR-NNN: Short decision title

- Status: Proposed | Accepted | Superseded | Rejected
- Date: YYYY-MM-DD
- Owners: names or roles
- Related tasks: task identifiers

### Context
What problem, constraints, evidence, and product requirements matter?

### Decision
What is being chosen and what is explicitly not being chosen?

### Alternatives considered
What credible options were evaluated, using which criteria?

### Consequences
What becomes easier, harder, risky, or newly required?

### Verification and follow-up
How will the decision be validated, reviewed, or revisited?
```

## Accepted records

- [ADR-001: Application architecture](adr/001-application-architecture.md)
- [ADR-002: Local persistence](adr/002-local-persistence.md)
- [ADR-003: Cloud data and authentication](adr/003-cloud-data-and-auth.md)
- [ADR-004: Private media](adr/004-private-media.md)
- [ADR-005: Synchronization](adr/005-synchronization.md)
- [ADR-006: Domain validation and types](adr/006-domain-validation-and-types.md)
- [ADR-007: Styling, design system, and motion](adr/007-design-system-and-motion.md)
- [ADR-008: Testing and continuous verification](adr/008-testing-and-ci.md)
- [ADR-009: Deployment and future packaging](adr/009-deployment-and-packaging.md)

## Decision criteria used in Phase 1

Future evaluation should explicitly consider:

- Offline creation, editing, browsing, and recovery
- Sync semantics and conflict transparency
- Strong per-user isolation and private media
- Deletion, export, backup, and data ownership
- Mobile and desktop responsiveness
- Accessibility and reduced motion
- Reliable autosave and robust persistence
- Testability, maintainability, operational complexity, and cost
- Honest security guarantees and a path to threat modeling
- Optional, consentful AI boundaries without coupling core journaling to AI

Architecture choices remain revisable through superseding ADRs. The [roadmap](../ROADMAP.md) defines sequencing.

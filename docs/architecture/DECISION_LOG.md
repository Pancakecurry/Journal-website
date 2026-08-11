# Architecture Decision Log

## Purpose

This log is the durable index of major technical decisions. Product and UX direction is defined elsewhere; architecture decisions must enable that direction, especially the Day-centered model, privacy, offline/local-friendly core, accessibility, and maintainability.

Task 000 intentionally makes no stack decisions.

## Decision status

| Area | Status | Decision |
| --- | --- | --- |
| Frontend framework | Undecided | To be evaluated in Task 001 |
| Runtime | Undecided | To be evaluated in Task 001 |
| Primary database | Undecided | To be evaluated in Task 001 |
| Local database/storage | Undecided | To be evaluated in Task 001 |
| Server architecture | Undecided | To be evaluated in Task 001 |
| Authentication | Undecided | To be evaluated in Task 001 |
| File/media storage | Undecided | To be evaluated in Task 001 |
| Sync mechanism | Undecided | To be evaluated in Task 001 |
| Conflict strategy | Undecided | To be evaluated in Task 001 |
| Deployment provider | Undecided | To be evaluated in Task 001 |
| PWA technology | Undecided | To be evaluated in Task 001 or a later focused task |
| Native wrapper | Undecided | To be evaluated later; no native assumption |
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

## Decision criteria for Task 001

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

Do not begin Task 001 from this document automatically. The [roadmap](../ROADMAP.md) defines sequencing; Task 001 requires separate authorization.

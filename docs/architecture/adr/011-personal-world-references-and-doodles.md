# ADR-011: Personal-world references and structured doodles

- Status: Accepted
- Date: 2026-08-15
- Owners: Founding product engineering
- Related tasks: 021–027

## Context

My World must reflect authorship without duplicating canonical journal records, and doodles must remain editable, local-first Day artifacts. Decorative unlock state, flattened drawing-only images, and journal-coupled game state would create misleading history or brittle ownership semantics.

## Decision

Keepsakes store user-owned references to canonical sources and are tombstoned independently. My World is derived from indexed record counts, not an unlock ledger. Doodles store normalized structured strokes plus a bounded preview, belong to a Day, and create one linked Moment. Resurfacing stores only explicit suppression records and performs bounded local queries. Games live behind a small registry/error boundary, load dynamically, and do not read or write journal content.

## Alternatives considered

- Copying source content into keepsakes was rejected because edits/deletions would diverge.
- Saving only raster doodles was rejected because reopen/edit would be lost.
- A game engine was rejected as unnecessary bundle and maintenance weight.
- A precomputed memory feed was rejected because the first rules are cheap, deterministic, and private on-device.

## Consequences

Source deletion must clean dangling keepsakes, doodle previews remain derived, and sync must support keepsake, doodle, and hidden-memory operations. My World stays sparse for a new person and becomes richer only when canonical records exist.

## Verification and follow-up

Repository and browser tests cover persistence, deletion, Day association, suppression, game cleanup, migration, and user isolation. Future sync/server implementations must preserve the same reference and tombstone semantics.

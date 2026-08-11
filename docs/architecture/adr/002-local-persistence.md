# ADR-002: Local Persistence

- Status: Accepted
- Date: 2026-08-12
- Related tasks: 005

## Context

Years of structured Days, moments, journals, preferences, media references, and sync state require queryable durable browser storage. `localStorage` is not suitable for volume, indexes, transactions, or migrations.

## Decision

Use IndexedDB through Dexie. Define explicit schema versions, stable client-generated UUIDs, compound indexes for user/date queries, typed repositories, and migrations that preserve existing data. Store pending media blobs without indexing blob payloads.

Official reference: [Dexie schema and migration model](https://dexie.org/docs/Tutorial/Understanding-the-basics).

## Alternatives considered

- Raw IndexedDB: no dependency, but more error-prone transaction and migration code.
- SQLite/WASM: strong relational semantics but greater bundle, persistence, and cross-browser complexity for this phase.
- localStorage: rejected as the primary journal database.

## Consequences

IndexedDB is the immediate interaction store, not a disposable cache. Migrations are additive/versioned and tested. Server rendering cannot read it; hydration states must be deliberate.

## Reversal

Repository interfaces and portable domain records permit a later SQLite/native adapter. Export/migration would be required before removing IndexedDB.

# Phase 3 — Personal History and Organization

Phase 3 adds planner-like retrieval without changing the Day-centered model. Calendar asks when something happened; Journal asks what was written; search finds local words; trackers attach chosen values to a Day; recap gathers one month's authored history.

## Local data

Dexie schema version 4 adds:

- rebuildable Day, Journal, and search indexes;
- journal bookmarks;
- tracker definitions and Day-based tracker entries;
- one authored reflection per month.

Canonical writing remains in the existing Day, Moment, Journal, Media, and Reflection stores. Derived stores deliberately omit original image blobs and complete journal bodies. Existing data is not cleared; missing indexes are rebuilt from canonical records when needed.

Search uses normalized Unicode text and token rows scoped by user ID. It is conventional local search—not semantic or AI search. React renders highlights as text nodes and `<mark>` elements; indexed content is never injected as HTML.

Tracker definitions support yes/no, count, number, 1–5 scale, duration, short text, and one-choice values. Entries retain both their actual Day and their later created/updated timestamps. Archiving preserves history. At most three pinned trackers appear on Today.

## Remote data and sync

Migration `202608120003_phase_3_history_organization.sql` adds bookmarks, tracker definitions, tracker entries, and monthly reflections. Each table has owner RLS, authenticated-only grants, user-owning foreign keys, versions, and tombstones. The outbox protocol accepts each new entity type with the same retry/conflict boundary as earlier records.

Derived search and display indexes remain local and are not synchronized as user-authored content.

## Privacy and offline behavior

Calendar, Library, search, backfill, tracker entry, and monthly reflection work against IndexedDB without a network. No history is sent to search or AI services. Remote behavior remains inactive until identity and project configuration are present.

See [Performance Strategy](PERFORMANCE_STRATEGY.md) for bounded-query rules.

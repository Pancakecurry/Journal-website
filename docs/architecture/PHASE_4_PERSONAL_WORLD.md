# Phase 4 — The Personal World

Phase 4 makes the journal feel inhabited without inventing progress. It implements Tasks 021–027 while preserving the Day as the canonical source of history.

## Personalization

Accent, paper character, notebook cover, environmental density, reduced-motion preference, and resurfacing controls are validated preferences. Changes preview live, persist only on save, work locally, and enter the outbox. Semantic tokens apply the choice across screens; personalization does not fork component styling or alter information architecture.

## My World and accumulation

My World queries bounded indexed counts and maps real records to useful desk objects. A new account gets a notebook, pen, sketchbook, and desk-break drawer—not fabricated photos or keepsakes. Days, photos, keepsakes, trackers, doodles, and completed month notes cause corresponding objects or labels to appear. Every object links back to its working product area.

## Keepsakes

A keepsake is a reference, not a copy. Current actions support Days, text Moments, photos, journal entries, and doodles. The archive opens the canonical source, removal does not delete that source, and a deleted source causes the dangling reference to be tombstoned. Local and server schemas preserve per-user ownership and outbox sync.

## Doodles

Doodles store normalized pointer points grouped into pen/eraser strokes, metadata, canvas dimensions, and a bounded JPEG preview. The renderer uses Pointer Events, incremental active-stroke drawing, device-pixel-ratio capping, undo/redo, clear confirmation, and keyboard-operable tools. Saving creates or updates the doodle and associates exactly one doodle Moment with its Day.

## Games

The registry lazy-loads Memory Flip and Tiny Fishing into an error boundary. Sessions keep local component state only, have no sound, tracking, scoring economy, or journal access, and clear timers on exit/unmount. Reduced-motion rules remove nonessential transitions.

## Memory resurfacing

The first rule looks for the same calendar date in prior years, nearest year first, within the user's one-to-ten-year range. It considers text Moments, local photos, journal writing, and doodles, skips mood-only Days, and loads only one eligible Day. A person may hide one item, hide a whole Day, or disable resurfacing; suppression is a synced user-owned record. No AI, external request, or push notification is involved.

## Persistence and sync

Dexie schema version 5 adds `keepsakes`, `doodles`, and `hiddenMemories` and migrates preference defaults without clearing earlier choices. The matching PostgreSQL migration adds owned tables, preference columns, indexes, RLS, grants, and isolation tests. Outbox entity types cover all new canonical writes and deletions.

See [ADR-011](adr/011-personal-world-references-and-doodles.md) for the durable data choices and [Performance Strategy](PERFORMANCE_STRATEGY.md) for query/render budgets.

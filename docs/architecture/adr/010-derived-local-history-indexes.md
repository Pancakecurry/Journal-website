# ADR-010: Derived local history indexes

- Status: Accepted
- Date: 2026-08-12
- Owners: Founding product engineering
- Related tasks: 014–020

## Context

Calendar, Journal Library, search, trackers, and recaps must remain useful across thousands of Days while offline. Loading lifetime records, full journal bodies, or image blobs into list screens would make long-lived journals progressively worse.

## Decision

Keep Day-owned records canonical and maintain rebuildable IndexedDB summaries for visible history surfaces. Use composite user/date indexes, body-free journal summaries, a user-scoped conventional token index, and range-indexed tracker entries. Do not synchronize derived search/display indexes as authored content.

## Alternatives considered

- Lifetime in-memory filtering was rejected because cost grows with the journal.
- Remote search was rejected because core retrieval must work offline and privately.
- Semantic/vector search was rejected because Phase 3 is conventional search and AI remains optional.
- Replacing canonical records with summaries was rejected because summaries are lossy.

## Consequences

Writes perform small derived-index maintenance and old records may require a one-time local rebuild. Indexes can be discarded and recreated without losing authored data. Query budgets and deterministic large fixtures become regression requirements.

## Verification and follow-up

Repository tests cover month bounds, pagination, local search isolation, a 1,050-Day fixture, tracker ranges, and migrations. Deployment-level Web Vitals remain follow-up evidence on representative devices.

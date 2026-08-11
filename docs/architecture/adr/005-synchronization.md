# ADR-005: Synchronization

- Status: Accepted
- Date: 2026-08-12
- Related tasks: 005–006

## Context

Ordinary journaling must write locally without waiting for a server. The product is single-user across personal devices, not a collaborative editor. Retries must not duplicate data or discard ambiguous work.

## Decision

Use a client outbox protocol:

1. Write domain record and outbox operation atomically in IndexedDB.
2. Address every entity and operation with client-generated UUIDs.
3. Push ordered operations with idempotency keys and expected server versions.
4. Server upserts under authenticated ownership and returns canonical version/timestamp.
5. Pull remote changes using a per-user monotonic cursor.
6. Retain tombstones until all relevant replicas can observe deletion.

Retry transient failures with bounded exponential backoff and jitter. Last-write-wins is permitted only when the expected version still matches. On ambiguous concurrent text changes, preserve a conflict copy and require later user choice; never silently discard one revision.

## Alternatives considered

- Every write goes directly to the server: rejected for latency and offline failure.
- CRDT/realtime collaboration: unnecessary complexity for primarily single-user content.
- Timestamp-only last-write-wins: risks silent loss and clock skew.

## Consequences

Sync state is explicit and testable. The initial remote adapter is a deterministic fake plus Supabase schema contract until project credentials/local services are available. Sync protocol changes require versioning.

## Reversal

The outbox and repository ports allow replacing transport or adopting a managed sync engine later, with a migration of pending operations.

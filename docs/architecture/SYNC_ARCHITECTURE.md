# Sync Architecture

IndexedDB is the responsive local working store. Supabase is the authenticated remote replica when configured. The product remains usable in explicit local-foundation mode when it is not configured.

## Identity and ownership

Configured mode mounts the journal only after `supabase.auth.getUser()` verifies the session. The active local partition is set to that verified user ID. The development-only local identity is never accepted by configured remote or AI routes.

## Push

Canonical writes enqueue stable, versioned outbox operations. The coordinator uploads pending media first, then sends entity mutations with the active user session. A sync-operation ID provides idempotency. Expected versions reject ambiguous concurrent updates; conflicts are preserved rather than silently overwritten. Successful acknowledgements update local sync metadata.

## Pull

Database triggers append owner-scoped change-feed rows for every canonical entity. The client advances a per-user cursor, fetches changed records through RLS, maps them into local tables, and refreshes derived indexes. Pending newer local work wins locally until its conflict is resolved; remote deletion cannot silently erase such work.

## Scheduling and failure

Sync runs at authenticated startup, after outbox writes, on reconnect, and periodically while mounted. Failure leaves the outbox intact and local journaling available. The UI distinguishes local-only, queued, syncing, and failed states.

## Required production proof

Apply all migrations to an operator-owned Supabase project, keep the media bucket private, run `npm run test:db`, and perform two-account cross-owner reads/writes plus media-path checks. Static policy review and local app tests do not replace that deployment proof.

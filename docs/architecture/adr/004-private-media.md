# ADR-004: Private Media

- Status: Accepted
- Date: 2026-08-12
- Related tasks: 006, 009

## Context

Photos must work with intermittent connectivity and must never become public accidentally. Upload, retry, deletion, access, and future transformation need explicit lifecycle states.

## Decision

Store local blobs in IndexedDB behind a media repository. Track `local`, `pending_upload`, `uploading`, `uploaded`, `failed`, and `pending_delete`. Remote originals live in a non-public Supabase Storage bucket under an owner-prefixed path with RLS. Persist object keys, not public URLs; obtain authenticated/signed access when needed.

Official reference: [Supabase Storage access control](https://supabase.com/docs/guides/storage/security/access-control).

## Alternatives considered

- Public bucket with obscure URLs: rejected; obscurity is not authorization.
- Database byte storage: complicates database size and delivery.
- Immediate-only upload: breaks local-first capture.

## Consequences

Compression and thumbnails sit at a replaceable processing boundary. Upload operations are retryable and idempotent. Deletion uses tombstones and later orphan cleanup; UI must not claim remote deletion before acknowledgement.

## Reversal

The object-key abstraction allows migration to another private object store without changing domain associations.

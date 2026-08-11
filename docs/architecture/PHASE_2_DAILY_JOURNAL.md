# Phase 2 Daily Journal

This note records implementation boundaries for Tasks 007–013. It applies the accepted Phase 1 ADRs; it does not select a new stack or dependency.

## Day-centered data flow

1. Today or a historical Day resolves a local calendar date and IANA timezone.
2. The local repository finds or transactionally creates one owner/date Day.
3. Text, mood, photo reference, journal reference, or reflection changes commit to IndexedDB immediately.
4. The same transaction queues stable, idempotent outbox operations where applicable.
5. UI reloads the complete Day bundle and reports what is safe locally. Network availability never gates the write.
6. The existing sync engine later acknowledges applied/duplicate operations, retains retryable failures, and preserves ambiguous conflicts.

Historical backfill uses the selected occurrence date while `createdAt` and `updatedAt` retain when the record was actually added or changed.

## Local schema version 3

- Adds `reflections`, unique in practice by owner + Day + morning/evening period.
- Adds media width, height, caption, upload attempts, and safe failure state.
- Retains Days, Moments, journal entries, blobs, preferences, outbox operations, and sync cursor data through additive upgrade functions.
- Keeps blobs and long journal bodies unindexed.

The server migration adds the equivalent reflection table, media metadata, composite Day ownership, RLS, and authenticated grants. Database policy tests exist but require a working local Supabase container.

## Media privacy and recovery

Supported local inputs are JPEG, PNG, and WebP up to 20 MB. Browser canvas preparation applies decoded orientation, limits the longest edge to 2560 px, and re-encodes pixels, which removes EXIF and other embedded file metadata. Capture stores the prepared blob before upload.

Remote originals use the private `journal-media` bucket and `${authenticatedUserId}/${mediaId}/original.ext`. The uploader derives the prefix from a verified Supabase user and rejects mismatched record ownership. It returns an object key, never a public URL. Lifecycle states distinguish local, pending, uploading, uploaded, failed, and pending deletion; retries preserve the local copy.

## Journals, reflection, and deletion

Journal pages are plain text with optional titles, a 650 ms debounced local autosave, explicit status, read/edit modes, and a route back to their Day. Reflection question definitions live outside UI components; one question appears at a time and every question can be skipped. Partial answers persist.

Deletes are soft tombstones plus outbox delete operations. Deleting a journal or photo also tombstones its linked Moment so Today and historical Days do not retain a broken card. Physical cleanup remains a later retention/sync concern.

## Known boundary

Phase 2 makes loaded local data network-independent. Cold offline application-shell loading remains Task 035. Supabase project configuration is environment-specific, so local-only development truthfully says remote sync is unconfigured rather than pretending an upload completed.

# Engineering Foundation

## Responsibilities

The repository separates:

- `src/app`: Next.js route and server/client composition boundaries
- `src/components`: product shell and foundation-level UI behavior
- `src/design-system`: Campus Atelier tokens and semantic surfaces
- `src/domain`: validated framework-independent records and constructors
- `src/infrastructure/local`: Dexie database and typed local repositories
- `src/infrastructure/media`: replaceable browser image preparation
- `src/infrastructure/supabase`: browser/server authentication clients
- `src/sync`: transport-independent outbox synchronization
- `supabase/migrations`: server schema, ownership constraints, RLS, and private Storage policies
- `supabase/tests`: pgTAP privacy/isolation tests
- `tests/e2e`: real-browser foundation guarantees

Persistence and transport logic must not move into view components. New broad `utils` collections and unused abstractions should be rejected.

## Local-first boundary

IndexedDB is the immediate journal store, not a cache. Creating a Day and text Moment writes the records and their outbox operations in one local transaction. Ordinary local writes do not require a server.

Phase 1 proves:

- create/retrieve a Day by owner and calendar date;
- attach a validated text Moment;
- retain it across database and browser reload;
- queue stable idempotent operations;
- retry network failures without deleting work;
- distinguish applied, duplicate, failed, and conflicting operations;
- preserve deletion as an explicit operation.

Application-shell caching is separate. A manifest exists, but production service-worker caching is intentionally Task 035. Therefore an already loaded shell can continue local data operations offline in Phase 1; a cold offline load is not yet promised.

## Sync protocol

1. Clients generate entity and operation UUIDs.
2. Domain change and outbox operation commit atomically.
3. A sync runner pushes ready operations in creation order.
4. The server applies ownership policy and expected-version checks.
5. Applied or previously applied operations are acknowledged exactly once locally.
6. Transient errors retain the operation and schedule bounded exponential backoff.
7. Ambiguous version conflicts remain explicit and preserve the remote revision for future resolution.
8. Deletes propagate as tombstones; physical cleanup occurs only after retention/sync policy permits.

The product is not a collaborative editor. Do not introduce CRDT or real-time merge complexity without a new ADR and concrete need.

## Database migration conventions

### Local

- Never edit a released Dexie version that contains an upgrader.
- Add the next integer version and retain historical upgrade functions.
- Migrate existing records transactionally and test an old database fixture opening at the new version.
- Never solve an upgrade by asking users to clear IndexedDB.
- Avoid indexing blobs or long journal bodies.

### Server

- Add timestamped, forward-only SQL files under `supabase/migrations`.
- Prefer additive changes and backfills before enforcing new constraints.
- Enable and test RLS on every private table before granting authenticated access.
- Pair destructive schema changes with an export/backfill/rollback plan in a superseding ADR.
- Apply migrations locally and run `npm run test:db` before linking or pushing them to a hosted project.

## Authentication and privacy

Supabase Auth supplies remote identity. Next.js server code uses cookie-aware clients; protected decisions must verify claims or users rather than trusting an unverified session payload. Browser code may use only the public project URL and publishable key. RLS remains the enforcement boundary even when application filtering exists.

All journal tables scope reads and writes to `auth.uid()`. Composite foreign keys prevent attaching a child record to another owner's Day or Moment. The `journal-media` bucket is private; object paths begin with the authenticated user ID and Storage RLS enforces that prefix.

No end-to-end encryption claim is made. The encryption approach remains undecided pending a threat model.

## Media lifecycle

Local media records support local blob, pending upload, upload, retry/failure, private remote object key, and pending deletion. Store object keys rather than public URLs. Phase 2 prepares JPEG, PNG, and WebP images in the browser, caps input at 20 MB, applies orientation, scales the longest edge to at most 2560 px, and re-encodes pixels before storage. Re-encoding strips embedded metadata; the original file is not retained. The local blob and dimensions commit before any remote work. Remote upload verifies the authenticated owner and writes only to an owner-prefixed private key.

## Phase 2 Day bundle

Dexie version 3 adds reflection records and media metadata while retaining the version 1→2 upgrader and existing records. A loaded Day bundle contains its Day, ordered moments, journal entries, local media, and morning/evening reflections. Mood, photo, and journal references are explicit Moment variants so Today stays chronological without making content type the primary navigation.

Journal autosave is debounced after local input changes. Deletion marks the entity and its linked timeline reference with tombstones and queues explicit delete operations; it does not physically erase records before sync and retention can observe them. See [Phase 2 Daily Journal](PHASE_2_DAILY_JOURNAL.md).

## Error and logging conventions

- Domain errors may identify an invariant but must not expose storage/provider internals to users.
- UI messages preserve input, state what is safe, and offer a recovery path.
- Never render stack traces, database text, object paths, secrets, or provider payloads.
- Logging must use event names and safe metadata; journal text and media content are private and excluded by default.
- Sync errors retain machine-readable internal state and a separate user-safe presentation.

## Security baseline

- Strict runtime validation at storage, environment, and network boundaries
- RLS and composite ownership constraints in PostgreSQL
- Private media bucket policies
- No browser service-role secret
- Security response headers and no unsafe HTML rendering
- Minimal public environment surface
- Dependency audit and lockfile

CSRF protection follows the chosen cookie/auth operation type: use same-site cookies and origin/CSRF checks for future state-changing server endpoints. Direct Supabase Data API access is protected by bearer tokens and RLS. Reassess this boundary whenever server actions or custom cookie mutations are added.

## Verification

Use `npm run verify` for formatting, lint, typecheck, unit/integration tests, and production build. Use `npm run test:e2e` after a build for browser navigation, IndexedDB reload persistence, offline local writes, mobile layout, and reduced motion. Use `npm run test:db` with the local Supabase stack for actual cross-user policy checks.

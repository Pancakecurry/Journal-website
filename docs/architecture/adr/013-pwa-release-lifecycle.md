# ADR-013: PWA Release and Update Lifecycle

- Status: Accepted
- Date: 2026-08-15
- Owners: Product engineering
- Related tasks: 035, 037, 038

## Context

The journal must open and accept locally persisted writing without a network connection, while authenticated APIs and private responses must never leak through a shared cache. Updates must not interrupt an unsaved draft.

## Decision

Use the Next.js manifest plus a small project-owned service worker. Precache only the versioned public shell, manifest, icons, and core navigation destinations. Runtime-cache same-origin documents and immutable static assets; never cache `/api/*`, `/auth/*`, Supabase responses, AI responses, exports, or private media. IndexedDB remains the journal system of record.

Register only in production. When a waiting worker exists, offer an explicit update action. Before activating it, dispatch a draft-flush event and allow bounded time for editors to persist. Activate with `SKIP_WAITING`, reload after `controllerchange`, and delete old versioned caches during activation.

## Alternatives considered

- A general-purpose PWA dependency was unnecessary for the narrow cache policy and would add release surface area.
- Network-first for all HTML would make a cold offline launch unreliable.
- Silent immediate activation could discard in-progress UI state.

## Consequences

The cache policy stays auditable and deliberately cannot make user-data confidentiality claims. Route changes require updating the shell list and PWA tests. Offline availability applies to locally available data; remote authentication, sync, AI, and uncached media still require their services.

## Verification and follow-up

Unit checks inspect the manifest, icons, exclusions, cache version, and update protocol. Playwright verifies a service-worker-controlled cold reload and local capture while offline. Production operations must test installation and updates on supported browsers after deployment.

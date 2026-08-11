# ADR-008: Testing and Continuous Verification

- Status: Accepted
- Date: 2026-08-12
- Related tasks: 002–006

## Context

The foundation must verify domain invariants, IndexedDB persistence/migration, retry-safe sync, SQL isolation, accessible navigation, reduced motion, and a real browser path.

## Decision

Use Vitest for unit/integration tests, Testing Library for component behavior, fake-indexeddb for deterministic local database tests, Playwright for browser smoke/responsive/offline checks, and pgTAP for local Supabase RLS tests. CI runs formatting, lint, typecheck, tests, build, and Playwright. Database tests run when the Supabase CLI/Docker service is available.

Official references: [Vitest guide](https://vitest.dev/guide/), [Playwright installation](https://playwright.dev/docs/intro), [Supabase database testing](https://supabase.com/docs/guides/local-development/testing/overview).

## Consequences

No arbitrary coverage target. Tests focus on product guarantees. Credential-dependent or unavailable service checks must be reported as unverified, never inferred from unit tests.

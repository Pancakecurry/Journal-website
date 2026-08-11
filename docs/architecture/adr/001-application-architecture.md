# ADR-001: Application Architecture

- Status: Accepted
- Date: 2026-08-12
- Related tasks: 001–004

## Context

The product needs excellent responsive web interaction, server/client security boundaries, accessibility, a credible PWA path, deployment flexibility, and future packaging without forcing core local writes through the network.

## Decision

Use Next.js 16 App Router, React 19, strict TypeScript, and an LTS-compatible Node.js runtime. Keep Day/domain/persistence modules framework-independent. Use Server Components by default for server-rendered structure and Client Components only for browser databases and interaction. Use npm with a committed lockfile.

Official references: [Next.js App Router](https://nextjs.org/docs/app), [Next.js PWA guide](https://nextjs.org/docs/app/guides/progressive-web-apps).

## Alternatives considered

- React Router: portable and capable, but requires assembling more server/auth conventions.
- SvelteKit: excellent UX and smaller runtime, but a smaller hiring/library surface for this long-lived product.
- Native-first Flutter/React Native: weakens the immediate universal web/PWA goal and duplicates web delivery concerns.

## Consequences

Browser-only modules must never execute during SSR. Next-specific code stays at route and infrastructure boundaries. The deployment remains portable to any supported Node host; Vercel is a recommendation, not a hard dependency.

## Reversal

Framework-independent domain, repository interfaces, SQL, and CSS tokens reduce migration cost. A framework change would still require rebuilding routes and rendering.

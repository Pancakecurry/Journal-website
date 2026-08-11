# ADR-009: Deployment and Future Packaging

- Status: Accepted direction
- Date: 2026-08-12
- Related tasks: 035–037

## Context

The app needs a straightforward hosted web path now and credible PWA, desktop, and mobile options later without premature native work.

## Decision

Recommend Vercel for the Next.js application and Supabase for managed Postgres/Auth/Storage. Keep standard Node-compatible code and migrations so another host remains possible. Add a web app manifest in Phase 1; defer production service-worker caching/installability to Task 035. Evaluate Capacitor for mobile wrapping and Tauri for desktop only after the web product and offline model mature; do not select either now.

Official reference: [Next.js PWA guide](https://nextjs.org/docs/app/guides/progressive-web-apps).

## Consequences

Deployment credentials and live infrastructure are not required for local foundation work. Full app-shell offline caching is distinct from already-network-independent local data operations.

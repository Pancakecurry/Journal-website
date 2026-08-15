# Campus Atelier Journal

Campus Atelier Journal is the working codename for a private, playful, local-friendly journaling environment organized around **the Day**. It makes recording ordinary life feel like placing thoughts, photographs, moods, reflections, and memories into a beautifully maintained personal notebook. The public product name is not final.

## Project status

**Current phase:** Phase 6 — v1.0 release candidate (Tasks 035–038 complete)

The repository contains the complete ordinary-Day, history, Personal World, optional intelligence, ownership, installability, and release-hardening loops. Core writing remains local-first, installable, and useful without AI. A real hosted release still requires operator-owned Supabase and deployment configuration; the repository does not pretend those external services are configured.

Future contributors and coding agents must read [AGENTS.md](AGENTS.md) before making changes.

## Local development

Requirements:

- Node.js 22 or newer
- npm (lockfile is committed)
- Docker only when running the local Supabase stack

```bash
npm install
cp .env.example .env.local
npm run dev
```

The application can run without Supabase credentials in local-foundation mode. In that mode, IndexedDB writes work and survive reload, while account authentication and remote synchronization remain visibly unconfigured. Do not put service-role or secret keys in browser-exposed variables.

AI also begins unconfigured and disabled. To test it, set the server-only `OPENAI_API_KEY` and a random `AI_CONSENT_SECRET` of at least 32 characters in `.env.local`; never prefix either with `NEXT_PUBLIC_`. Users must still explicitly enable external processing and choose content scopes in **Me → Privacy & AI**. Provider-backed behavior is never required for ordinary journaling or conventional Search.

For a local Supabase environment:

```bash
npx supabase start
npm run test:db
```

Copy the local project URL and publishable key into `.env.local`; never commit that file. See [Engineering Foundation](docs/architecture/ENGINEERING_FOUNDATION.md) for boundaries and migration conventions.

## Verification

```bash
npm run format:check
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
npm run verify:release
```

`npm run test:db` additionally verifies PostgreSQL policies when the local Supabase stack is available.

## Canonical documentation

### Product

- [Product vision](docs/product/PRODUCT_VISION.md)
- [Product principles](docs/product/PRODUCT_PRINCIPLES.md)
- [MVP scope](docs/product/MVP_SCOPE.md)
- [Non-goals](docs/product/NON_GOALS.md)

### Experience

- [UX architecture](docs/ux/UX_ARCHITECTURE.md)
- [Screen map](docs/ux/SCREEN_MAP.md)
- [User journeys](docs/ux/USER_JOURNEYS.md)
- [Campus Atelier design language](docs/ux/CAMPUS_ATELIER_DESIGN_LANGUAGE.md)
- [Motion language](docs/ux/MOTION_LANGUAGE.md)
- [Accessibility principles](docs/ux/ACCESSIBILITY_PRINCIPLES.md)

### Delivery and architecture

- [Roadmap](docs/ROADMAP.md)
- [Architecture decision log](docs/architecture/DECISION_LOG.md)
- [Engineering foundation](docs/architecture/ENGINEERING_FOUNDATION.md)
- [Phase 2 daily journal implementation](docs/architecture/PHASE_2_DAILY_JOURNAL.md)
- [Phase 3 history and organization](docs/architecture/PHASE_3_HISTORY_ORGANIZATION.md)
- [Phase 4 personal world](docs/architecture/PHASE_4_PERSONAL_WORLD.md)
- [Phase 5 intelligence, privacy, and hardening](docs/architecture/PHASE_5_INTELLIGENCE_PRIVACY_HARDENING.md)
- [Phase 6 release completion](docs/architecture/PHASE_6_RELEASE.md)
- [Export format](docs/architecture/EXPORT_FORMAT.md)
- [Performance strategy](docs/architecture/PERFORMANCE_STRATEGY.md)
- [Security threat model](docs/architecture/SECURITY_THREAT_MODEL.md)
- [PWA and offline architecture](docs/architecture/PWA_OFFLINE_ARCHITECTURE.md)
- [Sync architecture](docs/architecture/SYNC_ARCHITECTURE.md)
- [Release and PWA lifecycle decision](docs/architecture/adr/013-pwa-release-lifecycle.md)
- [User guide](docs/release/USER_GUIDE.md)
- [Privacy and data handling](docs/release/PRIVACY_AND_DATA_HANDLING.md)
- [Deployment guide](docs/release/DEPLOYMENT.md)
- [Native packaging evaluation](docs/release/NATIVE_PACKAGING_EVALUATION.md)
- [Release checklist](docs/release/RELEASE_CHECKLIST.md)

Meaningful changes to product or architecture must update the relevant source-of-truth document and, for lasting technical choices, add or supersede an ADR.

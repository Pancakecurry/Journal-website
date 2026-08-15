# Campus Atelier Journal

Campus Atelier Journal is the working codename for a private, playful, local-friendly journaling environment organized around **the Day**. It makes recording ordinary life feel like placing thoughts, photographs, moods, reflections, and memories into a beautifully maintained personal notebook. The public product name is not final.

## Project status

**Current phase:** Phase 4 — The Personal World (Tasks 021–027)

The repository now contains the complete ordinary-Day and history loops plus persisted stationery choices, a data-driven My World, keepsakes, editable Day-linked doodles, two isolated desk-break games, and private on-device memory resurfacing. Core writes land in IndexedDB first and enter the outbox protocol. Semantic memory and AI remain later work and are not required for journaling.

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
- [Performance strategy](docs/architecture/PERFORMANCE_STRATEGY.md)

Meaningful changes to product or architecture must update the relevant source-of-truth document and, for lasting technical choices, add or supersede an ADR.

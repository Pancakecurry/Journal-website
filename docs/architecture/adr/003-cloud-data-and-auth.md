# ADR-003: Cloud Data and Authentication

- Status: Accepted
- Date: 2026-08-12
- Related tasks: 006

## Context

Days, moments, journals, media, and preferences are relational and private. Authorization must remain correct even if a client changes identifiers. Local development, migrations, export/deletion, and cross-device sync need a coherent server foundation.

## Decision

Use Supabase-managed PostgreSQL, Supabase Auth, and database Row Level Security. Public/publishable keys may reach the browser only with RLS; service-role credentials never do. Next.js server clients use cookie-based SSR helpers and verified claims for protected server decisions. Version-controlled SQL migrations and pgTAP policy tests define the server.

Official references: [securing Supabase data](https://supabase.com/docs/guides/database/secure-data), [SSR client guidance](https://supabase.com/docs/guides/auth/server-side/nextjs), [database testing](https://supabase.com/docs/guides/local-development/testing/overview).

## Alternatives considered

- Custom Postgres/API/auth: maximum control, substantially more security and operations code.
- Document database: weaker fit for ownership, Day associations, constraints, and export.
- Hosted sync database products: attractive replication but higher platform coupling and less explicit server policy control.

## Consequences

Every private table enables RLS and scopes all operations to `auth.uid()`. Auth is required for remote sync, while previously authorized devices may continue local work according to future app-lock/session policy. Local-only mode is not a substitute for remote identity.

## Reversal

PostgreSQL schema and repository boundaries make provider migration feasible. Auth identity migration and storage URLs would require explicit work.

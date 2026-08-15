# Deployment Guide

## Required services

Deploy the Next.js application to a Node-compatible host and provision a Supabase project. Vercel is the evaluated default, not a hard platform dependency.

## Environment

Set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, and server-only `SUPABASE_SERVICE_ROLE_KEY`. For optional AI, set `AI_PROVIDER`, `OPENAI_API_KEY`, a random `AI_CONSENT_SECRET` of at least 32 characters, and the documented model values. Never expose server secrets through `NEXT_PUBLIC_*`.

Configure the Supabase site URL and allowed callback URLs for `/auth/callback` and `/auth/reset`. Apply migrations in order, keep the journal-media bucket private, and run database policy tests before taking users.

## Release procedure

1. Run `npm ci`, `npx playwright install chromium`, and `npm run verify:release`.
2. Start isolated Supabase, apply migrations, and run `npm run test:db`.
3. Deploy the immutable commit associated with the release tag.
4. Verify sign-up, callback, reset, sign-out, cross-account isolation, private media, push/pull sync, offline cold launch, update activation, export/restore, and deletion in staging.
5. If AI is configured, enable it only in a test account and verify consent scopes, citations, provider failure, retention settings, and deletion expectations.
6. Promote only the same verified artifact. Confirm `/manifest.webmanifest`, `/sw.js`, icons, CSP/security headers, and the production callback origins.

Do not expose a hosted app in local-foundation mode as if it were a private multi-user service.

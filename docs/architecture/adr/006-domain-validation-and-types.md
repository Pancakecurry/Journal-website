# ADR-006: Domain Validation and Types

- Status: Accepted
- Date: 2026-08-12
- Related tasks: 005–006

## Context

Static types disappear at network, storage, environment, and migration boundaries. Flexible future Moment variants must not devolve into unchecked arbitrary blobs.

## Decision

Use TypeScript strict mode and Zod schemas at trust boundaries. Model Moment content as a discriminated union with a foundation text variant and reserved future variants. Keep calendar dates as validated `YYYY-MM-DD` local-date strings with an IANA timezone, not UTC instants pretending to be days.

## Consequences

Domain constructors centralize invariants. Persisted data and sync payloads are parsed before use. Future variants require explicit schema additions and migrations.

## Reversal

Zod is isolated at boundary/domain schema modules and can be replaced without rewriting view components.

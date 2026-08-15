# ADR-012: Optional AI and local semantic memory

- Status: Accepted
- Date: 2026-08-15
- Related tasks: 028–030, 034

## Context

Campus Atelier needs optional meaning-based recall and grounded journal exploration without making AI necessary for capture, reading, conventional search, or offline journaling. Journal text and photo captions are highly private. A UI toggle alone is not a sufficient consent boundary, provider output is untrusted, and derived embeddings need a distinct lifecycle from canonical writing.

## Decision

The application owns a provider-neutral AI port. The first adapter uses OpenAI's server APIs through raw `fetch`; the provider key never reaches the browser and no provider SDK is added. OpenAI requests set `store: false` where the endpoint supports it. The default models are configurable and currently `text-embedding-3-small` at 512 dimensions and `gpt-5-mini`.

External processing is off by default and requires all of:

1. persisted user enablement and explicit category scopes;
2. a separate confirmation that selected content may leave the device;
3. a signed, HTTP-only, SameSite=Strict, scope-specific consent grant; and
4. an authenticated Supabase user in production.

Semantic chunks and vectors are derived, local IndexedDB data. They are versioned, incrementally replaced when their source fingerprint changes, removable without touching original records, and not synced. Questions and generated answers are ephemeral and are not stored as journal content or conversations.

Retrieval combines cosine similarity with a small lexical signal, returns at most 20 results, considers at most 5,000 local chunks per query, and supplies at most eight sources or 12,000 characters to generation. Photo bytes are never sent; only opted-in captions are eligible. Model output must satisfy a strict JSON schema and may cite only supplied source IDs. The assistant is read-only and has no application tools.

## Alternatives considered

- Browser-side provider keys: rejected because secrets and private content would be exposed.
- A server-owned remote vector store: rejected for this phase because it broadens retention, deletion, tenancy, and sync risk.
- Local embeddings only: attractive for later evaluation, but current browser size/performance tradeoffs were not yet proven.
- Provider-specific application code: rejected to preserve an adapter boundary. Google offers generation and embedding APIs and remains a viable future adapter. Anthropic is a generation candidate, but a separate embedding strategy would be needed.

## Consequences

Ordinary journaling and conventional search remain fully functional when AI is off, unconfigured, unavailable, or offline. Semantic queries require a configured external provider and connectivity; the local index alone does not currently embed a new query offline. Reaching more than 5,000 chunks requires a later approximate/local vector index rather than removing the bound.

Provider-side data handling remains governed by the configured provider and account terms. The product explains that boundary and does not claim end-to-end encryption or zero retention.

## Verification and follow-up

Unit tests cover incremental indexing, deletion, batching, grounding, structured provider output, source filtering, and `store: false`. E2E tests cover default-off and failure states. A configured-provider staging test remains a deployment responsibility because no production credential is committed.

References: [OpenAI API data controls](https://platform.openai.com/docs/models/default-usage-policies-by-endpoint), [Google Gemini embeddings](https://ai.google.dev/gemini-api/docs/embeddings).

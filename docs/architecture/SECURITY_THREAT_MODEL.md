# Campus Atelier Security Review and Threat Model

Reviewed 2026-08-15 for the Phase 5 application boundary.

## Protected assets and trust boundaries

The protected assets are journal text, reflections, captions, media, tracker history, doodles, preferences, authentication sessions, AI scopes, derived embeddings, and exports. Trust boundaries exist between the browser and IndexedDB, the browser and authenticated Supabase, private Storage, Next.js AI routes, the external AI provider, and the user’s downloaded archive.

## Attack surfaces and mitigations

| Surface                              | Current mitigation                                                                                                                                                                                                                              |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Production identity bypass           | Local-foundation identity is rejected by AI routes in production; configured production routes require a Supabase user session.                                                                                                                 |
| Cross-user records                   | Every remote user-owned table has RLS enabled with `auth.uid() = user_id`; anonymous grants are revoked. Storage is private and object paths must begin with the authenticated user ID. Client filters are defense in depth, not authorization. |
| AI consent bypass                    | External requests require same-origin POSTs and a short-lived signed, HTTP-only, SameSite=Strict grant whose category scopes must cover every submitted item/source.                                                                            |
| Prompt injection and source spoofing | Journal excerpts are delimited as untrusted source data; the assistant has no tools or write operations; responses are schema-validated and citations are intersected with supplied source IDs.                                                 |
| Context/cost abuse                   | 30 AI requests per minute per process/IP, request-body caps, 16-item embedding batches, 5,000 retrieval candidates, eight grounding sources, and 12,000 grounding characters. Provider quota errors fail without changing journal data.         |
| XSS/content injection                | React text rendering is used; model HTML is never rendered; journal Markdown is exported as a download rather than interpreted in the application.                                                                                              |
| Archive path or formula injection    | Archive names derive from sanitized IDs and fixed MIME mappings. No CSV is emitted. User content remains inside JSON/Markdown file bodies.                                                                                                      |
| Media exposure                       | The Supabase bucket is private, policy-scoped by owner path, size-limited, and restricted to JPEG/PNG/WebP/GIF. Local object URLs remain device-local and are revoked by consuming views.                                                       |
| Browser embedding and framing        | CSP limits scripts/connections, `frame-ancestors 'none'` prevents framing, and CORP, no-sniff, referrer, permissions, and frame headers reduce ambient browser attack surface.                                                                  |
| Sensitive logs                       | AI code does not log journal bodies, context, provider responses, tokens, media URLs, or exports. Errors shown to users are content-free.                                                                                                       |

## Review by user-owned domain

Migrations cover Days, moments, journals, media, reflections, preferences, sync records, bookmarks, trackers and entries, monthly reflections, keepsakes, doodles, and hidden memories with owner policies. Semantic chunks and index state are local derived data, not server tables. Assistant conversations are not stored. Phase 5 adds only preference columns, so existing owner policy coverage applies.

## Unresolved risks and release blockers

- The in-process AI request limiter is best-effort and not shared across server instances. A distributed authenticated-user limiter is required before broad production AI access.
- A real configured Supabase project and private bucket must pass pgTAP and live cross-account tests before release; static migration review is not a substitute.
- A configured AI staging environment must verify provider policy, quotas, deletion/retention controls, and failure behavior. No secrets belong in the repository.
- Complete ZIP generation eventually needs direct file streaming for multi-gigabyte archives.
- Final remote account deletion, media orphan cleanup, backup restoration, app lock, and an encryption-at-rest/end-to-end decision remain release work. The app makes no end-to-end encryption claim.
- CSP currently permits framework-required inline styles/scripts and development evaluation. Reassess nonce-based strict CSP with deployment telemetry rather than claiming a maximal CSP.

The first two items are production-release gates, not blockers to local Phase 5 behavior.

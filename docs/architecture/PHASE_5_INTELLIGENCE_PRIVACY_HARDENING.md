# Phase 5 Intelligence, Privacy, and Hardening

## Delivered boundaries

- Semantic personal memory is a removable local derived index over explicitly selected categories.
- Ask My Journal is a source-first, read-only research surface. The sources remain visible before any generated synthesis.
- AI begins disabled. A signed server consent grant, category scopes, production authentication, request limits, and provider configuration all gate external requests.
- The privacy center explains local/provider state, lets the user update scopes, disables new requests, and can delete embeddings without deleting original writing.
- Data ownership includes structured JSON, readable Markdown, and a complete ZIP containing both plus locally available media and doodle previews.
- Local deletion covers canonical records, preferences, local outbox state, summaries, search indexes, and AI-derived data. Final remote account deletion remains deployment/orchestration work and is described honestly in the UI.
- Accessibility, performance, and application security received dedicated automated and code-review passes. Their concrete limits are recorded below and in linked documents.

## Data classification

| Class                        | Examples                                                                        | Location and lifecycle                                                         |
| ---------------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Canonical user data          | Days, moments, journals, reflections, trackers, keepsakes, doodles, preferences | IndexedDB first; eligible for the existing authenticated outbox/sync model     |
| Local derived data           | summaries, conventional search documents, semantic chunks and vectors           | Rebuildable and independently deletable; semantic data is not synced           |
| Ephemeral AI data            | research question and generated answer                                          | Browser memory for the active view; not persisted as a conversation            |
| Externally processed content | explicitly scoped text and captions used for embeddings or a grounded answer    | Sent only after server-enforced consent; governed by provider/account controls |

## Offline and sync behavior

Capture, editing, Day browsing, conventional Search, games, personalization, and export of locally available records remain local-first. AI setup, indexing, meaning-based queries, and synthesis fail clearly when the provider or network is unavailable. AI failures do not alter canonical records or block the outbox.

AI preferences follow the existing preference record and migration path. Semantic vectors and conversations are intentionally excluded from synchronization and exports. The SQL migration adds AI enablement, external-processing consent, and scoped access columns with a database constraint that forbids enabled AI without consent.

## Experience upgrade

The Phase 5 pass also raises the existing application from a structural notebook to a more layered Campus Atelier environment. Navigation, Me, Personalization, My World, doodles, privacy, AI research, and both desk games now use clearer typographic roles, stronger material composition, responsive layouts, spatial motion, and explicit reduced-motion behavior. The supplied study-space references informed organization, softness, modular storage, and authored accumulation without introducing fake cultural text, streaks, currencies, confetti, or sticker overload.

## Related records

- [ADR-012](adr/012-optional-ai-and-semantic-memory.md)
- [Export format](EXPORT_FORMAT.md)
- [Performance strategy](PERFORMANCE_STRATEGY.md)
- [Security threat model](SECURITY_THREAT_MODEL.md)
- [Accessibility principles](../ux/ACCESSIBILITY_PRINCIPLES.md)

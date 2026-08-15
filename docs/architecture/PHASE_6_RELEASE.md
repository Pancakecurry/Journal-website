# Phase 6: Installability and Release Completion

Phase 6 completes Tasks 035–038 without opening another product phase. It turns the Phase 5 product into a deployable release candidate through verified authentication boundaries, a narrow installable/offline shell, bidirectional sync, resilient storage and updates, archive restore, remote account deletion, release-scale regression coverage, and operator documentation.

## Release boundary

- A configured deployment uses verified Supabase sessions and per-user local partitions; unconfigured development remains explicitly local-only.
- The PWA caches application structure, never canonical journal/API/AI data.
- Offline writes persist locally and queue for reconnect; ambiguous versions preserve both sides.
- Export and restore are user-controlled, versioned, bounded, and non-overwriting.
- AI remains optional and off without explicit scopes and server credentials.
- No native wrapper was added; the PWA is the v1.0 install route.

The [release checklist](../release/RELEASE_CHECKLIST.md) separates repository-complete gates from external deployment proof. See the [PWA architecture](PWA_OFFLINE_ARCHITECTURE.md), [sync architecture](SYNC_ARCHITECTURE.md), [security review](SECURITY_THREAT_MODEL.md), and [deployment guide](../release/DEPLOYMENT.md).

# Privacy and Data Handling

Campus Atelier stores the working journal in this browser's IndexedDB. In configured mode, authenticated records synchronize to an RLS-protected Supabase project and media to a private owner-scoped bucket. The project makes no end-to-end-encryption claim.

- Journal content is not public and is never used for a social feed.
- Local-foundation mode does not silently create a cloud account or sync.
- AI is optional, disabled by default, and requires explicit category scopes. Only selected source excerpts are sent for a requested operation. Derived semantic vectors stay local and can be deleted; assistant conversations are not retained by the app.
- Service-worker caches exclude API, auth, AI, export, and private-media responses.
- Exports are assembled locally and downloaded to the user's device.
- Restore validates archives before writing and does not silently replace conflicts.
- Remote account deletion requires a verified session and server-only administrator credential. Local data is removed only after remote deletion succeeds; local-only users can explicitly erase this device.
- Application logging must not include journal bodies, AI context, provider responses, access tokens, private URLs, or export contents.

Operators are responsible for publishing their actual hosting/provider privacy terms, retention policy, backup policy, incident contact, and supported deletion timeline before accepting real users.

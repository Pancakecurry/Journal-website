# Export Format

Campus Atelier exports are generated in the browser from locally available IndexedDB records. They are not uploaded to create a download and no public archive URL is produced.

## Formats

- **Structured JSON:** a versioned `campus-atelier-journal-export` object containing a manifest plus active Days, moments, journal entries, reflections, media references, preferences, tracker definitions and entries, monthly reflections, keepsakes, doodle metadata, bookmarks, and hidden-memory choices.
- **Readable Markdown:** a chronological journal grouped by Day, with journal writing, reflection answers, moods, text moments, photo captions, and monthly reflections.
- **Complete ZIP:** `manifest.json`, `data/journal.json`, `journal.md`, a short README, locally available image blobs under `media/`, and saved doodle previews under `media/doodles/`.

Current `formatVersion` is `1.0.0`. Consumers must branch on that value rather than assuming future fields. Import is deferred.

## Exclusions and privacy

Semantic vectors, derived AI chunks, conventional search indexes, and ephemeral assistant questions/answers are excluded. Doodle structured strokes remain canonical metadata; previews are bundled as media. Filenames are generated from sanitized internal IDs and trusted MIME-to-extension mappings. User text is serialized as data, never treated as an archive path or HTML.

The UI reports progress, supports cancellation between reads/assets/compression stages, and reports failure without deleting source data. Compression uses the small `fflate` dependency because browser-native APIs do not provide a portable ZIP writer. The archive is assembled from binary chunks; very large multi-gigabyte journals remain a known browser-memory limit and should move to a file-system streaming target when platform support is adopted.

Local data deletion is separate, typed, and destructive. It removes this user’s canonical and derived local records. It does not claim to delete remote account data until a configured authenticated server orchestration performs that lifecycle.

# Performance Strategy

Performance is a continuous product requirement. A private journal must remain calm and responsive after years of use, not only on an empty account.

## Phase 3 baseline

The untouched Phase 2 application passed all functional checks. The production build's cold compile took 81 seconds while warm routes and the application bundle remained comparatively small. Local investigation found the host disk at 99% capacity, an empty Turbopack cache after an internal cache reset, unusually slow Git metadata operations, and two different applications contending for port 3000. These are environment constraints, not evidence that a warm production journal route takes 81 seconds.

One application-level risk was also confirmed: the Day bundle loaded original media blobs eagerly. Phase 3 history surfaces therefore never load media blobs or complete journal bodies for lists, grids, search, or recaps.

## Data-access budgets

- Calendar queries exactly one visible month through `[userId+localDate]`.
- Journal Library reads at most 20 body-free summaries per page (hard cap 50).
- Search is debounced by 220 ms, begins with a composite user/token lookup, caps candidates at 300, and returns at most 100 results.
- Tracker charts query one visible date range through `[userId+trackerId+localDate]`.
- Monthly recap reuses the bounded month summary query.
- Today remains a single-Day query. Media blobs are limited to that Day and object URLs are revoked.

Derived `daySummaries`, `journalSummaries`, `searchDocuments`, and `searchTerms` are local indexes, not canonical user records. They can be rebuilt from Day-owned records and are updated after local writes. This avoids loading full journal bodies or lifetime history into UI collections.

## Scale fixtures

`src/test/history-fixtures.ts` provides deterministic `several`, `year`, and `large` datasets. The large fixture contains 1,050 Days, 3,150 Moments, and 350 journals. Repository tests assert bounded month, pagination, search, and user isolation against these datasets.

## Measurement and regression practice

For every history feature:

1. measure cold and warm behavior separately;
2. report host constraints such as disk pressure and cache resets;
3. inspect production builds rather than treating development compilation as runtime latency;
4. keep list payloads bounded and body/blob-free;
5. test keyboard, reduced motion, slow-loading, empty, and offline states;
6. capture Web Vitals in a configured deployment when representative devices and persistence are available.

No performance number is claimed as a production guarantee from this local environment.

## Phase 4 budgets

- My World uses indexed counts and renders only objects earned by real records; it does not hydrate lifetime entries or media blobs.
- Keepsake browsing is capped at 200 references and validates canonical sources before display.
- Same-date resurfacing performs at most one indexed Day lookup per configured year (one to ten, five by default), then reads only that Day's candidates.
- Doodles keep normalized structured strokes for editing, draw pointer-move segments incrementally, cap canvas device-pixel ratio at two, and store one bounded JPEG preview.
- Games are dynamically imported only when their drawer is opened. Timers are cleared on exit/unmount and game state is discarded rather than persisted into the journal.
- The Phase 4 long-term fixture verifies 720 indexed Days without changing My World's query shape. Browser performance remains subject to representative-device profiling in Phase 5 hardening.

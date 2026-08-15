# PWA and Offline Architecture

Campus Atelier is installable without turning the browser cache into a private-data store. The service worker supplies the application shell; IndexedDB supplies locally available journal records and media.

## What works offline

- launch a previously visited production build;
- open Today and locally available history;
- capture text and locally available photos;
- write journals, reflections, trackers, keepsakes, and doodles;
- use local games and conventional local search;
- queue mutations for later synchronization.

Authentication refresh, remote sync, external AI, and media not present on the device require a connection. The UI reports those boundaries without blocking local writing.

## Cache boundary

`public/sw.js` precaches public shell assets and uses versioned same-origin caches for navigations/static assets. It refuses API, auth, cross-origin, and non-GET requests. Canonical records never enter Cache Storage. Old caches are removed on activation.

## Installation and updates

The manifest provides standalone display, scoped launch, maskable icons, and core shortcuts. The Install surface uses the browser install prompt when available and gives platform-specific guidance otherwise. Updates wait for user acknowledgement; editors receive a draft-flush event before worker activation and reload.

## Storage pressure

Me → Storage reports browser estimates and locally stored media size and can request persistent storage where supported. Quota failures produce specific, recoverable messages and do not clear the current text/drawing. Users can export and then deliberately remove local data; the app does not run surprise cleanup.

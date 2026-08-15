# Native Packaging Evaluation

## Recommendation

- Desktop: ship the installable PWA first. Re-evaluate Tauri only for capabilities the browser cannot responsibly provide, such as a stronger OS lock or file-system streaming.
- Mobile: ship the installable PWA first. Re-evaluate Capacitor if store distribution, native share/camera integration, or reliable platform background sync becomes a validated need.

No native wrapper is included in v1.0.

The PWA already preserves one web codebase, offline local storage, installation, responsive layouts, and the reviewed service-worker boundary. A wrapper would add signing, store review, permission, update, secure-storage, deep-link, and platform QA obligations without improving the journal's current core loop. Native packaging should start only from a written capability gap and a new security/privacy review—not from a desire to look more finished.

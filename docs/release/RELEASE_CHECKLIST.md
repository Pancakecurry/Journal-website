# v1.0 Release Checklist

## Repository gates

- [ ] `npm ci`
- [ ] `npm run verify:release`
- [ ] no high/critical dependency audit findings
- [ ] production build and service-worker headers verified
- [ ] working tree clean; release commit exists remotely

## External gates

- [ ] production Supabase variables and allowed auth redirects configured
- [ ] migrations applied; `npm run test:db` passes in isolated/current target
- [ ] two-account RLS and private-media smoke test passes
- [ ] deployment smoke-tested on desktop and mobile
- [ ] privacy/retention/support details published
- [ ] optional AI provider checked live, or AI remains unconfigured/off

## Product acceptance

- [ ] new account onboarding and returning-user path
- [ ] Today capture, journal autosave, photo, reflections
- [ ] Calendar, history, search, trackers, recap
- [ ] Personalization, My World, keepsakes, doodles, both games
- [ ] installed cold offline launch and offline write
- [ ] reconnect sync and conflict preservation
- [ ] export, inspect, restore, and deletion
- [ ] keyboard, screen reader, text zoom, contrast, and reduced motion

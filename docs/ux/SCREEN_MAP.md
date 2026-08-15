# Screen Map

This is the conceptual hierarchy, not a commitment to routes, component boundaries, or a frontend framework.

## Entry

- Splash/loading
  - Local restoration and startup status where needed
- Lock/auth
  - Sign in or unlock
  - Recovery and understandable failure states
- Onboarding
  - Minimal introduction
  - Lightweight preferences
  - Initial visual accent
  - Optional reflection preference

## Today

- Today home
  - Date and contextual greeting
  - Mood/check-in affordance
  - Chronological moment timeline
  - Journal/photo previews
  - Add to Today
- Quick Capture
  - Immediate text capture
  - Optional format selection
  - Media attachment where available
- Morning check-in
  - Gradual, skippable prompts
- Evening wrap-up
  - Gradual, skippable prompts
  - Restrained completion acknowledgement
- Completed-day state
  - Accumulated Day; never an incomplete/complete score

## Calendar

- Month
  - Subtle content, photo, or mood presence indicators
- Day preview
- Historical day
  - Read-first timeline
  - Edit and backfill
  - Occurrence and later-edit provenance where appropriate
- Monthly recap
  - Bounded month highlights and counts
  - Autosaved authored reflection
  - Reserved cover hook for later personalization

## Journal

- Journal library
  - Chronological writing associated with its Day
- Search/filter
  - Conventional Search (always available)
  - Journal Research (optional, consent-gated)
    - Explore by meaning
    - Ask My Journal with sources first
- New entry
  - Focused writing surface
  - Autosave and recovery status
- Entry detail
  - Read and edit
- Prompted/reflection writing
- Bookmarks

## My World

- Desk
  - Authored history and accumulated objects
- Customization
- Keepsakes
- Doodle library and new/reopened doodle
- Desk-break drawer
  - Memory Flip
  - Tiny Fishing
- Same-date memory card and suppression controls

## Me

- Preferences
- Trackers
  - Definition, pin, archive, and open-ended value type
  - Visible-range notebook history with textual summary
- Reflection preferences
- Privacy and data controls
  - AI scopes, provider state, index removal
- App lock
- Offline/sync
- Export
  - Structured JSON
  - Readable Markdown
  - Complete ZIP with local media
- Backup
- Accessibility
- Appearance

## Global

- Search
- Quick Capture / Add to Today
- Notification preferences
- Offline state
- Sync state

## Relationships

- Selecting any date opens or previews that Day.
- A Journal item always retains a route back to its original Day.
- Search results reveal content in Day context.
- Backfilled content appears on the Day when it occurred, with later-added metadata when relevant.
- Tracker, reflection, media, and future game artifacts are pieces of a Day—not competing top-level mental models.

See [UX Architecture](UX_ARCHITECTURE.md) for area responsibilities and [User Journeys](USER_JOURNEYS.md) for lifecycle behavior.

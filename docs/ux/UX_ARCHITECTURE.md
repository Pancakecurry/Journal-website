# UX Architecture

## Experience model

The Day is the primary experiential container. Today is the active Day; historical days are previous pages of the same life. Journal entries, photographs, moods, reflections, tracker values, and custom moments remain associated with the Day even when browsed through specialized indexes.

The primary question is “What happened today?” Secondary areas answer narrower retrieval questions:

| Area     | Primary question                               | Experience intensity                      |
| -------- | ---------------------------------------------- | ----------------------------------------- |
| Today    | What happened today?                           | Expressive / Desk                         |
| Calendar | When did this happen?                          | Organized / Notebook                      |
| Journal  | What have I written?                           | Organized / Notebook; Paper while writing |
| My World | What has my personal space become?             | Expressive / Desk                         |
| Me       | How does this private environment work for me? | Organized / Notebook                      |

`+ Add to Today` is a near-global action. Global search, offline/sync status, and relevant preferences support every area without becoming primary destinations.

## Today

Today receives the highest UX investment. It combines the current date, a warm contextual greeting, optional mood/reflection prompts, and a chronological timeline of moments. It should visibly accumulate over the day:

- Morning is relatively clean and may gently offer a check-in.
- Afternoon reflects the pieces already placed into the Day.
- Evening may grow visually warmer and make wrap-up more discoverable.
- A completed evening reflection may receive a tiny date stamp or comparable physical acknowledgement.

Nothing labels a sparse day incomplete. Prompts are optional, skippable, and must not obstruct direct capture.

## Quick Capture

The first affordance asks, in essence, “What happened?” Plain text can be saved immediately. Thought, Photo, Mood, Journal, Activity, Tracker, and Custom may emerge as optional formats, but type selection is never a prerequisite for text capture.

Capture should preserve user input through interruptions and failures. Its detailed persistence and offline mechanics will be chosen later, not in Task 000.

## Journal and reflection

Long-form writing transitions from the expressive desk toward focused paper. Typography, margins, readability, concentration, autosave confidence, and minimal controls take precedence over environmental decoration. It must not resemble a rich-text CMS.

Morning and evening reflection are conversational, gradual, and skippable rather than survey-like. Users may answer one prompt, several, or none. Reflection responses remain connected to their Day and may also appear in the Journal library when relevant.

## Calendar and history

Calendar is a refined planner/index, not an analytics heatmap. Subtle marks can indicate that content, photographs, or mood “live here,” without implying productivity or quality.

The month planner loads one visible month and adapts cell density for mobile. Selecting a populated date opens a small preview before the read-first Day. Monthly recap remains a reflective desk surface: modest counts provide orientation, while authored memories and an optional autosaved note carry the meaning.

Historical days are read-first but editable. Users can backfill old memories. Where appropriate, the system distinguishes:

- **Occurred on:** the Day to which the memory belongs
- **Added or edited on:** later provenance metadata

The interface visually attaches the memory to the Day it describes and reveals provenance without making the historical page feel like an audit log.

## Journal library

Journal is a chronological route into longer writing, reflections, and relevant written memories. It preserves original-day association. Search, filters, bookmarks, entry detail, and new writing support retrieval without replacing the Day-centered model.

## Trackers

Trackers are open-ended personal notation—coffee, sleep, called home, headaches, movies, exercise, a good hair day, or anything else. The product does not decide what deserves tracking. Notebook-like visualization is preferred over business analytics; trackers must not create scores, streak pressure, or a productivity hierarchy.

Search is a near-global utility, not a sixth primary product area. Conventional Search always searches locally available words and dates with clear empty states and Day-preserving results. Optional Journal Research may add meaning-based recall and grounded synthesis, but it stays source-first, consent-gated, visually native to the notebook, and unnecessary for ordinary retrieval.

## Privacy and data ownership

Me groups serious controls as a readable private cabinet rather than an enterprise settings panel. AI permissions use category-specific choices and explain local versus external work. The off state removes optional entry points without weakening conventional Search. Export offers readable, structured, and complete copies; local deletion uses literal language and explicit confirmation. Beauty never obscures what leaves the device, what is derived, or what will be deleted.

## My World

My World is the most expressive accumulated personal space. It currently uses notebook identity, Days, photo counts, keepsakes, trackers, doodles, and two tucked-away desk games to form a useful desk composition.

Personality emerges through actual use and authorship:

- Day 1: clean and prepared
- Week 1: chosen accents and small traces of use
- Month 1: visible monthly history
- Month 3: meaningful bookmarks, photographs, and organization
- Month 6: clearly inhabited by this person

This progression reflects content and choices, not purchased or gamified unlocks. Mini-games live inside My World, remain isolated from journal data, and create artifacts only when a future game genuinely benefits from it.

## Cross-cutting state model

Every implemented area should deliberately handle relevant states:

- Empty and first-use
- Loading or restoring
- Saved, saving, and recoverable draft
- Offline, locally available, pending sync, and synchronized
- Failure and retry
- Permission or privacy boundary
- Reduced-motion and assistive-technology use
- Mobile, desktop, touch, keyboard, and pointer interaction

Status should be understandable and calm. Offline or sync state must not be represented as a vague icon when the user's data confidence depends on it.

## Navigation evolution

The five primary areas and near-global capture action are canonical information architecture, not a frozen navigation widget. Future UX work may adapt placement by device and research, provided the Day remains primary and all changes update the [screen map](SCREEN_MAP.md) and relevant product documentation.

## Product voice

Campus Atelier speaks plainly and with a little everyday wit. “What happened?”, “Nothing here yet. Totally legal.”, and “Lunch absolutely counts.” are representative: direct, relaxed, and never trying to turn an ordinary moment into a life lesson. Saving, deletion, offline, privacy, and failure messages become more literal—not more playful—when trust is at stake. See [Product Principles](../product/PRODUCT_PRINCIPLES.md#11-sound-like-a-normal-person).

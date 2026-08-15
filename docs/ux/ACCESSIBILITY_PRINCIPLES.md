# Accessibility Principles

Accessibility is part of product correctness, not a final hardening pass. The tactile visual metaphor must never make the product harder to read, navigate, understand, or trust.

## Core requirements

### Perceivable

- Maintain readable contrast on paper tones, translucent tabs, accent colors, photographs, and textured surfaces.
- Do not encode mood, sync, presence, selection, or error state by color alone.
- Provide useful text alternatives for user and interface imagery where appropriate.
- Keep decorative objects out of the accessibility tree unless they convey information.
- Support text resizing and reflow without clipped content or overlapping layers.

### Operable

- Support complete keyboard navigation for capture, writing, history, dialogs, and settings.
- Use visible, material-appropriate focus indicators; never remove focus styling without an accessible replacement.
- Provide comfortable touch/pointer targets and spacing.
- Avoid keyboard traps and preserve logical focus when surfaces unfold, slide, open, or close.
- Do not require drag, hover, complex gestures, or precise pointer movement; offer equivalent controls.

### Understandable

- Use clear labels and predictable navigation despite the notebook metaphor.
- State saving, offline, sync, conflicts, permissions, destructive actions, and recovery in plain language.
- Make optional prompts clearly optional. Avoid guilt, urgency, and completion pressure.
- Preserve user input and explain recoverable errors without blaming the user.

### Robust

- Prefer semantic controls and content structures that work with assistive technologies.
- Announce important dynamic updates—such as save failure or a newly added moment—without excessive interruption.
- Test with representative screen readers, keyboard-only use, zoom/text scaling, touch, and reduced motion when implementation begins.

## Writing and cognition

- Prioritize readable line length, margins, type size, spacing, and hierarchy in long-form modes.
- Keep primary writing controls minimal while ensuring features remain discoverable.
- Present reflection questions gradually and allow skipping or stopping at any point.
- Avoid dense forms, unnecessary categorization, and memory-dependent multi-step interactions.
- Provide calm empty, loading, failure, and recovery states.

## Motion and sensory comfort

Honor system and in-product reduced-motion settings as described in [Motion Language](MOTION_LANGUAGE.md). Avoid flashing, large unexpected movement, persistent ambient animation, and sound/haptics without user control. Never make motion, texture, or sound the only feedback channel.

## Personalization boundaries

User-selected colors, textures, accumulated objects, and future customization must remain within accessible constraints. Offer safe defaults and prevent personalization from hiding navigation, reducing essential contrast, or overwhelming focused Paper modes.

Personalization choices use text labels, pressed states, and a live preview that is not the only indication of selection. Paper patterns and accents never carry meaning alone. A reduced-motion choice can request stillness but cannot force motion against an operating-system preference.

My World objects remain semantic links in a readable source order even when the desktop composition becomes spatial. Doodle controls use native buttons, labels, Pointer Events, and keyboard-operable undo/redo; saved previews have authored fallback descriptions. Games use buttons rather than gesture-only controls, contain errors, keep sound off, and clean up timers. Resurfaced memories include plain-language source links and separate item/Day suppression buttons.

## Verification expectation

Future feature tasks should define applicable accessibility acceptance criteria, add automated checks where valuable, and include manual verification for interactions automation cannot establish. Any unverified requirement must be disclosed.

## Phase 5 hardening

Automated browser checks now run axe against the primary journaling, history, personal-world, privacy, export, personalization, and intelligence routes. A reflow check uses a 640 CSS-pixel viewport as the browser equivalent of 200% zoom on a 1280-pixel desktop, and a reduced-motion run verifies that core controls stay operable. These checks supplement—not replace—keyboard and screen-reader review.

AI scope choices use semantic checkboxes and never rely on color. Source references precede generated synthesis. Export progress uses native progress semantics and cancellation remains keyboard reachable. Game controls have button/keyboard paths, touch targets, readable session state, timer cleanup, and a non-animated reduced-motion mode. The redesigned personalization preview is decorative support; every choice also has a visible label and pressed/selected state.

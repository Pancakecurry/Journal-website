# ADR-007: Styling, Design System, and Motion

- Status: Accepted
- Date: 2026-08-12
- Related tasks: 003–004

## Context

Campus Atelier needs custom editorial composition and tactile hierarchy. A generic visual component kit would pull the shell toward ordinary SaaS. Accessibility and reduced motion remain mandatory.

## Decision

Use product-owned CSS custom-property tokens, global foundations, and colocated CSS Modules for components. Build a small semantic primitive set. Use Motion for React only where spatial choreography exceeds CSS transitions; configure reduced motion at the root and retain CSS media-query fallbacks.

Official reference: [Motion reduced-motion configuration](https://www.motion.dev/docs/react-motion-config).

## Alternatives considered

- Utility-first styling: productive, but can diffuse the token/material system across markup.
- Generic component theme: rejected as a visual foundation; accessible unstyled primitives may be evaluated later.
- CSS-only motion: sufficient for basics, less maintainable for coordinated presence/layout transitions.

## Consequences

Campus Atelier owns color, type, material, state, and spacing. Dependencies may provide behavior but not appearance. Motion remains sparse and semantic: Place, Lift, Slide, Turn, Unfold, Stamp, Tuck.

## Reversal

Standards-based tokens and semantic HTML survive styling-library changes.

# Motion system and prototype plan

Defined before implementation. Keep the existing `framer-motion` dependency; use its Motion values, transforms and layout transitions. CSS handles pointer/focus/press feedback. No GSAP, smooth-scroll package, WebGL or additional runtime animation dependency is necessary.

## Principles

1. Preserve an object's identity while its meaning changes.
2. Movement must answer an action or explain a relationship.
3. Information and actions are available immediately; animation is never the source of state truth.
4. One dominant movement per scene; the surrounding composition remains quiet.
5. Interruptible state transitions; rapid clicks cannot leave stale success states or delayed callbacks.

## Tokens

| Use | Time | Curve / behavior |
|---|---|---|
| Hover / press / focus | 140–180ms | `cubic-bezier(.2,.75,.25,1)`; color, 1–2px position, no layout movement |
| Panel / receipt replacement | 240–360ms | `cubic-bezier(.22,1,.36,1)`; short crossfade/translation |
| Credential reposition | 500–650ms | `cubic-bezier(.22,1,.36,1)`; transform continuity, no bounce |
| One opening composition | 650–800ms | bounded settle; page remains readable throughout |
| Verification progression | three/four short steps, ≤1.4s total | each state explicitly labels checking/passed/failed/not checked; cancellation replaces prior run |
| Scroll transformation | direct Motion values | progress maps to transform/opacity; native scrolling and no snap or wheel interception |

## Prototypes to evaluate before the page

1. **Hero artifact:** credential/proof control, tactile document separation; legible even before interaction.
2. **Lifecycle:** four stages with one shared artifact and an active path; buttons support keyboard and direct access.
3. **Consent:** native checkboxes, live selected count, selected-values-only recipient receipt after approval, editable reset.
4. **Verification:** active/revoked/suspended examples; a revoked credential can have a valid signature, and suspended trust stops later checks.
5. **Scroll transformation:** separate record fragments join along a path; desktop uses one bounded sticky scene.

Prototype in an isolated HTML study, capture desktop/mobile screenshots and exercise all five state changes. Then implement refined reusable React components rather than carrying prototype-only JavaScript into the application.

## Responsive and accessibility alternatives

- Desktop pin only when width ≥1024px, height ≥700px, pointer is fine, and reduced motion is off. Bound the scene to approximately 1.7 viewports; no empty scroll spacer on small screens.
- Touch, short screens and reduced motion show an ordinary-flow connected layout. Lifecycle buttons always provide direct stage access.
- Under reduced motion, remove perspective, travel, pinning and stagger. Render meaningful end states without delays. Verification can resolve immediately while still showing each check's outcome.
- SVG geometry is decorative and hidden from assistive technology; equivalent labels and values remain ordinary HTML.
- Native controls, visible focus, live feedback for user-triggered changes, and no announcements for each scroll pixel.
- Reserve artifact dimensions before animation; avoid layout reads in scroll handlers, continuous rotation, perpetual background animation or cursor followers.

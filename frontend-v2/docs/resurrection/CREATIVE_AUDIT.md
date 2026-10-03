# Design Resurrection V2 — creative audit

Phase A, 3 October 2026. Completed before implementation.

## Sources and scope

Read the complete `../FRONTEND_RECONNAISSANCE.md`, `../design/DESIGN.md`, and `../FRONTEND_V2_MASTER_PROMPT.md`. The brief's `frontend_ins/docs/FRONTEND_RECONNAISSANCE.md` does not exist; the current reconnaissance lives in `frontend-v2/docs` (the copy in `frontend-v3/docs` has the same size and modification time). Reviewed all supplied company design analyses, the draft's marketing components, portal navigation, overview, shared primitives, types, provider and data client.

New work belongs in `frontend-v2`. Preserve `frontend_ins`, `frontend`, backend, migrations, integration tests, existing design specifications and reconnaissance. Only runtime caches from rendering the draft change there.

## Rendered evidence

Started the existing Next app on 127.0.0.1:3100. Captured and visually reviewed `screenshots/draft-desktop.png` (1440 × 900) and `screenshots/draft-mobile.png` (390 × 844). Measured approximately 1,160 whitespace-separated words in the landing main element, including interface labels. The first narrative capture occurred during a transition and is not reliable evidence of the settled section.

## What works

- The source/holder/requester model is recognizable in the interactive hero.
- Forest green, semantic status labels, restrained surfaces and actual credential metadata are appropriate brand foundations.
- The portal has valuable working routes, scoped demo actors, central fixtures, request decisions, issuer governance and error primitives.
- The mock adapter is isolated from screens. Demo entry mints no token and is explicitly separate from live authentication.

## What needs to change

| Observation | Consequence | Decision |
|---|---|---|
| Hero contains a 19-word headline, a paragraph, two buttons, three assurances, plus many preview labels | Competing reading tasks; first impression is a document | One short headline, one sentence, two actions and one large artifact |
| Mobile preview begins near y=660 and is cropped below the first viewport | Product comprehension depends on additional scrolling | Recompose the mobile hero with a compact, fully visible credential |
| Repeated eyebrow/heading/paragraph/grid pattern | Each section feels equally important; narrative stalls | Give each act a distinct visual job and composition |
| “Friction” is a numbered prose list | The problem is explained rather than experienced | Transform four disconnected record fragments into one connected path |
| Issuance, trust, consent and limitations recur in multiple sections | Technical repetition increases perceived complexity | Put detail on /how-it-works and /trust; demonstrate the main idea once |
| Reveal and stagger wrappers provide most movement | Motion signals visibility, not product change | Animate the artifact, claim release and ordered verification states |
| Hero jumps directly from consent to a verification success | Approval can appear synonymous with verification | Show approval and the verifier's separate action distinctly |
| Display font silently differs from documented DM Sans | Rendering depends on locally installed serif fonts | Bundle actual display and interface fonts |
| Portal includes API-rule prose in normal decision panels | Engineering detail displaces next actions | Keep concise user outcomes; document contracts outside task flows |

## Retain / redesign / retire

Retain the verified workflows, existing route aliases, typed service seam, deterministic fixtures, form validation, scoping logic and useful shared primitives. Reconcile stale mock contracts against the new reconnaissance before relying on them.

Redesign marketing completely, portal shell/overview, credential presentation, demo entry, page headers, loading/empty/error states and navigation. Keep portal motion short and functional.

Retire repeated marketing feature grids, prose assurances, generic reveal cascades, implementation notes in product surfaces and unsupported wallet/QR implications.

## Asset opportunities

A custom linked-C mark, security-print credential linework (decorative, never a claim of security), a visible issuer imprint, one continuous path through the lifecycle, a claim-selection aperture, and a verification receipt. Render these as SVG and HTML so the actual words and controls remain accessible.

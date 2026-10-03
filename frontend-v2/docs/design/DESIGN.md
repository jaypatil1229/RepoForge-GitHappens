# CredLink Frontend v2 — Design System & Experience Direction

**Status:** Foundational design specification  
**Product:** CredLink — a trusted network for portable, verifiable credentials  
**Scope:** Frontend experience and visual system. This document does not define backend implementation.

---

## 1. Product truth and experience thesis

CredLink helps people prove important facts about themselves without repeatedly chasing institutions, collecting paperwork, or exposing more personal information than a situation requires.

The product should make three ideas immediately understandable:

1. **People shouldn't have to keep proving the same thing.** Education, employment, financial, and healthcare records are scattered across institutions and life stages.
2. **Institutions should be able to verify trustworthy claims.** They need confidence in who issued a credential and whether it is valid.
3. **People should stay in control of what they share.** A verification request should be understandable, purpose-bound, and limited to the information needed.

The experience must communicate this through real product flows and concrete examples—not abstract claims about “revolutionizing identity,” “the future,” or “seamless ecosystems.”

### The central story

**From paperwork scattered across your life → to credentials you can use when they matter.**

A visitor should understand the problem, see how CredLink changes the experience, recognize what they can do as a citizen or institution, and then enter the relevant product flow.

### Product language guardrails

Prefer:
- “Prove your degree without requesting another transcript.”
- “Share only the details this application needs.”
- “Check who issued a credential and whether it is still valid.”
- “One verified record. Useful at the next step.”

Avoid unsupported or misleading promises:
- “Zero-knowledge” unless the implementation genuinely provides cryptographic zero-knowledge proofs.
- “100% secure,” “tamper-proof,” “instant,” or “fully decentralized” unless demonstrated and technically substantiated.
- Calling the current product a self-sovereign identity wallet if the implementation is a centrally managed credential vault.
- Suggesting that a UI consent toggle alone guarantees data minimization or privacy.

Use precise, human language. Explain technical terms only when they help a user make a decision.

---

## 2. Creative direction: a distinct hybrid

CredLink's visual identity is a deliberate blend of:

- **Apple:** calm hierarchy, generous whitespace, quiet transitions, refined surfaces, careful detail.
- **Linear:** crisp product UI, purposeful density, sharp information architecture, excellent interaction states.
- **Stripe:** confident typography, editorial storytelling, polished diagrams, credible institutional tone.
- **Notion:** approachable language, clear modularity, low-friction navigation.
- **Vercel:** restrained monochrome foundations, clean developer-grade precision, disciplined use of accent color.

These are references for principles—not templates to copy. CredLink should feel like its own product: **a calm, human-centered trust network with the clarity of a modern SaaS tool and the warmth of a public utility.**

### Desired emotional response

- “I understand what this does.”
- “This feels trustworthy, not intimidating.”
- “I can see exactly what I am sharing and why.”
- “The interface is thoughtful and easy to follow.”
- “This feels designed by a product team, not assembled from a template.”

### Avoid the familiar AI-generated look

Do not use:
- Purple/blue gradient washes, glowing blobs, glassmorphism everywhere, or gradients as decoration.
- Repeated floating cards with identical rounded corners.
- Oversized generic hero text followed by a grid of interchangeable feature cards.
- Random decorative dots, orbit diagrams, sparkles, or abstract AI imagery.
- Emoji as icons or decoration.
- Excessive pills, badges, shadows, and borders.
- Every section centered with the same heading-description-card rhythm.
- Motion that exists only to make the page look “animated.”

Use a few strong compositions, varied section rhythms, deliberate typography, real interface previews, and meaningful whitespace.

---

## 3. Brand foundations

### Brand attributes

| Attribute | Expression |
|---|---|
| Trustworthy | Clear provenance, precise status language, visible issuer context |
| Human | Plain language, reassuring guidance, respectful handling of sensitive data |
| Calm | Soft neutrals, restrained contrast, measured animation |
| Capable | Dense workflows remain legible; no oversimplification of real tasks |
| Connected | Consistent relationships between people, credentials, issuers, and requests |
| Accountable | Explain what happened, what is needed next, and who can act |

### Brand voice

- Direct, warm, composed, and specific.
- Use active verbs.
- Explain outcomes before mechanisms.
- Avoid jargon in public-facing copy; retain precise terminology in institutional workflows.
- Never use hype to compensate for an unclear value proposition.
- Do not use emojis. Use a consistent icon library or simple diagrams.

### Naming and terminology

Use “credential” for a verifiable record issued by an institution. Use “verification request” for a request to check a claim. Use “consent” only where a person is actually being asked to authorize sharing. Distinguish issuer authorization, credential validity, and citizen consent—they are different concepts.

---

## 4. Color system

The palette is designed to feel quiet and durable. Green is the brand anchor, not a decoration to apply to every element. Use semantic colors sparingly and consistently.

### Core tokens

| Token | Hex | Use |
|---|---|---|
| `ink-950` | `#17211D` | Primary text, dark navigation, high-emphasis surfaces |
| `ink-800` | `#2C3933` | Secondary headings and strong body text |
| `ink-600` | `#5F6D66` | Secondary text |
| `ink-500` | `#748078` | Muted labels and supporting copy |
| `paper-0` | `#FFFFFF` | Main canvas and elevated surfaces |
| `paper-50` | `#F8FAF8` | App background |
| `paper-100` | `#F0F4F1` | Quiet sections and subtle fills |
| `line-200` | `#E2E9E4` | Borders and dividers |
| `line-300` | `#D2DDD5` | Stronger separators |
| `forest-800` | `#234B3A` | Primary brand action |
| `forest-700` | `#2F6049` | Hover/active brand action |
| `forest-100` | `#E7F0EA` | Soft brand background |
| `forest-50` | `#F2F7F3` | Very subtle brand tint |

### Semantic colors

| Token | Hex | Meaning |
|---|---|---|
| `success-700` | `#176B4D` | Verified, completed, active |
| `success-50` | `#EDF8F2` | Success background |
| `warning-700` | `#946200` | Needs attention, awaiting action |
| `warning-50` | `#FFF7E5` | Warning background |
| `danger-700` | `#B42332` | Revoked, failed, destructive |
| `danger-50` | `#FFF0F1` | Error background |
| `info-700` | `#315E9B` | Informational status |
| `info-50` | `#EFF5FC` | Information background |

### Color rules

- Default to neutral surfaces. Use forest green for primary actions and meaningful brand emphasis.
- Never communicate state through color alone; pair color with text and, where useful, an icon.
- Do not use a rainbow of domain colors across the entire interface. Domain identifiers may use restrained tints, but the overall system must remain coherent.
- Meet WCAG AA contrast for text and controls. Verify actual combinations rather than assuming the palette is accessible.
- Avoid large saturated color blocks unless they serve a clear structural or storytelling purpose.

---

## 5. Typography

Typography is a major part of the brand. Use a distinctive but highly readable pairing, with a clear role for each face.

### Recommended pairing

- **Display / editorial headings:** `DM Sans` — expressive, modern, human, and confident without feeling corporate-generic.
- **Product UI and body:** `Inter` — highly legible at small sizes and reliable for dense dashboards.
- **Identifiers / technical values:** `IBM Plex Mono` — use sparingly for DIDs, IDs, timestamps, and code-like values.

Load through `next/font/google` where permitted by the project’s deployment and licensing requirements. If remote font loading is unsuitable, use a documented local/self-hosted fallback. Do not silently substitute a random system font.

### Type scale

| Role | Desktop | Mobile | Weight / line height |
|---|---:|---:|---|
| Display XL | 64–76 px | 42–48 px | 600 / 0.98–1.05 |
| Display L | 52–60 px | 38–44 px | 600 / 1.02–1.08 |
| H1 | 44–52 px | 34–40 px | 600 / 1.08–1.15 |
| H2 | 32–40 px | 28–34 px | 600 / 1.12–1.2 |
| H3 | 24–28 px | 22–26 px | 600 / 1.2 |
| H4 | 18–20 px | 18–20 px | 600 / 1.3 |
| Body large | 18–20 px | 17–18 px | 400 / 1.55–1.65 |
| Body | 15–16 px | 15–16 px | 400 / 1.5–1.65 |
| UI / label | 13–14 px | 13–14 px | 500 / 1.4 |
| Micro | 11–12 px | 11–12 px | 500 / 1.35 |

Rules:
- Use optical sizing and letter spacing carefully; do not globally tighten every heading.
- Avoid long all-caps labels. Reserve uppercase for short metadata labels only.
- Keep body copy to comfortable line lengths (roughly 55–75 characters).
- Use tabular numerals for metrics, amounts, and timestamps.
- Establish hierarchy with size, weight, and spacing before adding color.

---

## 6. Layout, spacing, and shape

### Grid

- Marketing content max width: approximately 1200–1280 px.
- App content max width: approximately 1440 px, with responsive gutters.
- Desktop gutters: 48–72 px for marketing, 32–40 px for app.
- Tablet gutters: 24–32 px.
- Mobile gutters: 18–22 px.
- Use a 12-column marketing grid and a flexible app grid. Do not force every section into the same column layout.

### Spacing scale

Use a consistent 4 px base scale: `4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96, 120`.

Use larger vertical section spacing (96–144 px desktop; 64–88 px mobile) to create an editorial rhythm. Compact app workflows should use tighter spacing where it improves task completion.

### Radius

- Small controls: 8–10 px.
- Inputs and buttons: 10–12 px.
- Standard panels: 14–18 px.
- Large marketing surfaces: 20–24 px.
- Pills only for compact status or metadata—not as the default shape for every element.

Prefer soft edges, but avoid making every component excessively round. A consistent radius system feels intentional; random radii feel assembled.

### Elevation

Use borders and tonal separation before shadows. Shadows should be soft, low-opacity, and reserved for floating menus, dialogs, and a small number of elevated surfaces. Avoid the “card on card on card” pattern.

---

## 7. Motion principles

Motion should feel like a physical interface settling into place: quiet, purposeful, and optional.

### Library guidance

- Use **Framer Motion / Motion for React** for page transitions, reveal choreography, layout changes, and component interactions.
- Use **GSAP only when a specific sequence or scroll-linked composition genuinely needs it.** Do not install both libraries by default for simple fades or transitions.
- Prefer CSS transitions for hover, focus, and small state changes.
- Avoid scroll hijacking and animation that delays access to content.

### Motion tokens

| Token | Duration | Easing | Use |
|---|---:|---|---|
| `motion-fast` | 120–180 ms | `ease-out` | Hover, focus, pressed states |
| `motion-standard` | 220–320 ms | `cubic-bezier(0.22, 1, 0.36, 1)` | Menus, panels, disclosure |
| `motion-emphasis` | 420–650 ms | `cubic-bezier(0.22, 1, 0.36, 1)` | Hero and section entrances |
| `motion-layout` | 280–420 ms | `cubic-bezier(0.2, 0.8, 0.2, 1)` | Reordering and layout changes |

### Rules

- Animate opacity and small translations (typically 8–20 px), not dramatic scale or rotation.
- Use stagger only for a small number of related elements.
- Avoid perpetual motion, bouncing, elastic easing, glowing effects, and animated gradients.
- Respect `prefers-reduced-motion`; provide a genuinely reduced experience, not merely shorter durations.
- Ensure content is visible and usable if animations fail or are disabled.
- Never make a user wait for an animation to finish before interacting.

---

## 8. Iconography and illustration

- Use one consistent line-icon family (Lucide is the default recommendation).
- Standard sizes: 16 px inline, 18–20 px controls, 24 px feature icons, 32 px only for prominent illustrative moments.
- Use consistent stroke weight and alignment.
- No emoji icons, emoji bullets, or decorative emoji.
- Prefer bespoke, simple diagrams that explain issuer → credential → consent → verification over generic stock illustrations.
- Product screenshots and interface mockups should use realistic sample data, clear labels, and accessible contrast.

---

## 9. Landing page: narrative architecture

The landing page is not a feature catalogue. It is a guided explanation that moves from a familiar frustration to a credible product outcome.

### Section 1 — Hero: the repeated-proof problem

**Purpose:** Make the visitor recognize the problem before introducing the platform.

Possible headline direction:
> Your records are verified once.  
> They should work wherever life takes you.

Supporting copy:
> Degrees, work history, and essential records are scattered across institutions. CredLink helps people reuse trusted credentials and share only what a request needs.

Primary CTA: **See how it works**  
Secondary CTA: **Explore the institution portal**

Visual:
- A restrained editorial composition showing a person moving through life stages (education → work → finance/healthcare).
- Show the old experience as repeated document requests, then a clear transition to a reusable credential.
- The visual should explain the product without requiring animation. Motion may reveal the transformation gently.
- Avoid a generic dashboard screenshot as the hero’s only visual.

### Section 2 — The friction people recognize

**Purpose:** Name real pain points with empathy.

Use a short narrative or alternating editorial blocks:
- Re-requesting transcripts and certificates.
- Waiting for manual checks.
- Sending entire documents when only one fact is needed.
- Losing track of which record is current or who has verified it.

Do not overstate frequency or claim quantified savings without evidence.

### Section 3 — The CredLink shift

**Purpose:** Explain the new mental model in three clear steps.

1. **An institution issues a credential.** The source and credential details are recorded.
2. **A person receives a request.** The purpose and requested claims are visible.
3. **The person authorizes sharing; the recipient verifies.** The recipient checks the relevant claims and issuer status.

Use a horizontal sequence on desktop and a vertical step flow on mobile. Make the distinction between issuing, consenting, and verifying unmistakable.

### Section 4 — Show what a person actually gets

**Purpose:** Make the value tangible.

Feature a citizen-facing credential view:
- Credential name and issuer.
- Issued date and current status.
- What claims are included.
- Where it can be used.
- A clear, human-readable sharing request.

Use realistic sample data and label it as a demo. Do not imply that the current product has a mobile wallet if it does not.

### Section 5 — Show what institutions get

**Purpose:** Address institutional buyers/users without derailing the citizen story.

Explain the practical workflow:
- Issue records using authorized schemas.
- Receive purpose-specific verification requests.
- Review request status and consent.
- Verify issuer and credential status.
- Inspect an audit trail.

Use a focused product preview with annotated callouts, not a wall of feature cards.

### Section 6 — Domains and life stages

**Purpose:** Show breadth after the core concept is understood.

Present Education, Employment, Finance, and Healthcare as examples of where portable credentials can help. Use a consistent layout and concise, grounded use cases. Do not imply every domain is fully production-ready unless verified.

### Section 7 — Trust, explained

**Purpose:** Build confidence through transparency rather than security buzzwords.

Explain in plain language:
- Who issued the credential.
- What is being requested.
- What the person is authorizing.
- How validity/revocation is represented.
- What the audit record captures.

Only describe controls that are actually implemented. Link to a technical trust/security explainer if one exists.

### Section 8 — Closing CTA

Reinforce the central outcome in one sentence, then offer clear paths:
- **Explore the demo**
- **Institution access**
- Optional: **Read how verification works**

Avoid a second oversized hero or a generic “Ready to transform your future?” closing.

### Footer

Include product navigation, citizen/institution paths, documentation, privacy, terms, contact, and an accurate project/company identity. Do not invent compliance certifications, partner logos, or legal claims.

---

## 10. Application experience

The authenticated portal is a work tool. Keep the same brand DNA but prioritize clarity, speed, accessibility, and task completion over marketing-style whitespace.

### Global app shell

- Stable left navigation on desktop; responsive drawer or bottom navigation on small screens where appropriate.
- Clear active organization/context and role.
- Main content begins with a page title, a one-sentence purpose, and the primary action.
- Breadcrumbs only when they clarify hierarchy.
- Consistent page gutters, section spacing, table density, and empty states.
- Avoid excessive nested cards. Use tables, grouped lists, and clear sections when they represent data better.

### Dashboard

Answer these questions at a glance:
1. Which organization/context am I operating in?
2. What needs my attention?
3. What has happened recently?
4. What can I do next?

Prioritize actionable summaries over vanity metrics. Each metric must have a clear definition and, where useful, a route to the underlying records.

### Credential management

- Make search, filters, status, issuer, subject, and issue date easy to scan.
- Use clear status text: Active, Revoked, Expired, Pending—not ambiguous color-only chips.
- Keep row actions discoverable and predictable.
- Provide detail views that distinguish credential metadata from claims.
- Confirm destructive actions and explain consequences.

### Verification center

Treat each request as a decision workflow:
- Who is requesting?
- For whom?
- Why?
- Which claims are requested?
- What is the current consent/request state?
- What action is available?
- What will happen next?

Use a readable request detail panel. Separate “awaiting consent,” “approved,” “denied,” “expired,” and “verified” states. Never make “approved” appear synonymous with “verified” unless the underlying process truly defines them that way.

### Trust registry and issuer directory

- Explain the difference between an issuer being listed, authorized, suspended, and revoked.
- Show issuer identity, domain, authorized schemas, status, and relevant timestamps.
- Use progressive disclosure for technical identifiers.
- Make provenance legible to nontechnical users without hiding detail from institutional users.

### Audit trail

- Prioritize scanability: timestamp, event, actor/organization, affected record, outcome.
- Search and filters should be prominent and useful.
- Detail views should explain the event in plain language and expose technical metadata as secondary information.
- Do not claim immutability unless the implementation supports it.

### Forms and dialogs

- Group related fields and explain why sensitive information is requested.
- Use inline validation, persistent labels, and clear error recovery.
- Preserve entered values when safe to do so.
- Avoid multi-step forms unless steps meaningfully reduce cognitive load.
- Dialogs should be reserved for focused decisions; use full pages for complex workflows.

---

## 11. Components and interaction states

Every reusable component must define:
- Default
- Hover
- Focus-visible
- Active/pressed
- Disabled
- Loading (where applicable)
- Error (where applicable)
- Empty (for data components)
- Success/confirmation (where applicable)

### Buttons

- Primary: forest background, white text; one dominant primary action per region.
- Secondary: neutral surface with a clear border.
- Tertiary: text action for low-emphasis operations.
- Destructive: semantic danger styling and explicit confirmation.
- Consistent height, icon spacing, and focus ring.
- Avoid using a different button style for every section.

### Inputs

- Persistent labels; placeholders are examples, not labels.
- Visible focus state and clear validation message.
- Use helper text for context and sensitive-data explanations.
- Ensure keyboard operation and adequate target sizes.

### Tables

- Consistent column alignment and row height.
- Sticky headers only when they materially help.
- Responsive strategy: horizontal scroll, column prioritization, or a mobile list—not a squeezed desktop table.
- Include loading skeletons, empty states, and error/retry states.

### Status indicators

Pair status color with explicit text. Use one shared status vocabulary across dashboard, tables, detail pages, and audit events.

---

## 12. Accessibility and inclusive design

Target WCAG 2.2 AA as the implementation baseline.

- Full keyboard navigation and visible focus.
- Semantic landmarks and heading order.
- Correct labels and accessible names for icon-only controls.
- Sufficient text and non-text contrast.
- Reduced-motion support.
- Screen-reader announcements for async status changes.
- Errors identified in text and associated with fields.
- Avoid color-only meaning.
- Touch targets should be comfortably usable, especially on mobile.
- Test zoom/reflow and narrow viewports.

---

## 13. Responsive behavior

Design mobile deliberately rather than shrinking desktop.

- Marketing hero: stack text and visual; keep CTA visible without awkward wrapping.
- Narrative sections: alternate only when it improves comprehension; otherwise use a clear vertical flow.
- App navigation: collapse into a drawer or an appropriate compact pattern.
- Data tables: choose a deliberate mobile presentation.
- Dialogs: become near-full-screen sheets on small viewports when content requires it.
- Avoid horizontal overflow except in explicitly scrollable data regions.
- Test at 360 px, 390 px, 768 px, 1024 px, 1280 px, and 1440 px widths.

---

## 14. Content and data integrity

- Use plausible synthetic data and clearly mark demo/synthetic records.
- Do not use real personal information in screenshots or fixtures.
- Keep dates, counts, status, and labels internally consistent.
- Empty, loading, error, and permission-denied states are part of the design—not afterthoughts.
- Never fabricate backend capabilities in the UI. Where behavior is not implemented, present a truthful demo interaction or mark it as illustrative.
- Avoid placeholder Latin text and generic “Lorem ipsum.”

---

## 15. Design QA checklist

Before calling a page complete, verify:

- [ ] The page has one clear purpose and a visible primary action.
- [ ] Typography hierarchy is intentional and consistent.
- [ ] Layout rhythm differs appropriately between editorial and task-focused areas.
- [ ] Color is restrained and semantic.
- [ ] No emoji, decorative gradients, or generic AI-template motifs.
- [ ] Every interaction has appropriate states and feedback.
- [ ] Keyboard and reduced-motion behavior work.
- [ ] Mobile layout is designed, not merely compressed.
- [ ] Loading, empty, error, and success states are covered.
- [ ] Copy describes real product behavior accurately.
- [ ] No unsupported security, privacy, compliance, or decentralization claims.
- [ ] The visual design supports the user's understanding of the workflow.

---

## 16. Reference library

Use these as study references for specific design principles. Do not copy their branding or layouts.

| Reference | Study for | CredLink adaptation |
|---|---|---|
| Apple | Calm hierarchy, typography, motion restraint, product storytelling | Make complex identity workflows feel approachable and composed |
| Linear | Dense app UX, keyboard-first patterns, crisp navigation | Improve institutional portal clarity and speed |
| Stripe | Editorial storytelling, diagrams, technical trust communication | Explain credential issuance and verification in a visual, credible way |
| Notion | Plain-language onboarding, flexible content structure | Make first-time user journeys understandable |
| Vercel | Minimal surfaces, precise typography, developer-grade polish | Keep technical data clean without overwhelming the user |
| GOV.UK Design System | Plain language, accessibility, task-focused flows | Treat trust and sensitive information with public-service clarity |
| Wise | Clear financial workflows and status communication | Make verification and consent states understandable |
| Figma | Product education and interface-led storytelling | Use annotated UI previews instead of abstract feature claims |

**Reference rule:** Capture what works (hierarchy, pacing, clarity, interaction behavior), then translate it into CredLink's own visual language. Do not reproduce a reference page section-for-section.

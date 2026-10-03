---
version: alpha
name: Ramp
description: "A light interface extracted from Ramp accented with #000000, with a 8px spacing system and a system-ui type stack."
sourceUrl: "https://www.ramp.com"

colors:
  primary: "#000000"
  on-primary: "#ffffff"
  text: "#000000"

typography:
  display:
    fontFamily: "system-ui, sans-serif"
    fontSize: 48px
    fontWeight: 700
    lineHeight: 1.5
  heading:
    fontFamily: "system-ui, sans-serif"
    fontSize: 32px
    fontWeight: 600
    lineHeight: 1.5
  body:
    fontFamily: "system-ui, sans-serif"
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.5
  mono:
    fontFamily: "monospace"
    fontSize: 13px
    fontWeight: 400
    lineHeight: 1.5

spacing:
  base: 8px
  scale: [8]

motion:
  easing: "ease"
---

## Rationale

Ramp is a B2B financial operations platform (expense management, accounting automation), so its design system prioritizes clarity, trust, and professional efficiency. The measured tokens reveal a deliberately minimal, high-contrast aesthetic: pure black text on white, system fonts for speed and neutrality, and an 8px spacing grid that enforces consistency without ornamentation. There are no border radii, no shadow depth, and no easing motion—this is intentional restraint. The absence of a secondary color palette and the complete reliance on monochrome suggests confidence in content hierarchy through typography weight and scale alone, rather than chromatic differentiation. This approach signals financial seriousness and accessibility-first thinking: maximum legibility, no visual noise, no emotional color coding that might distract from data or transactions.

The typography system uses a single sans-serif family (system-ui fallback) across all roles, avoiding designer-picked typefaces in favor of OS-native rendering. This choice reduces bundle size, ensures consistent rendering across devices, and reinforces a utilitarian, no-nonsense brand voice. The display tier at 48px/700 weight anchors hero statements; headings at 32px/600 organize content sections; body at 16px/400 carries instructional and explanatory copy; monospace at 13px serves code, numbers, or data contexts. The 1.5 line-height across all scales reflects generous spacing for readability—critical for dense financial interfaces where users scan quickly and need clarity.

Spacing is driven by a single 8px unit, implying a strict modular grid. No custom breakpoints are recorded, suggesting either a fluid/responsive design or that Ramp uses CSS-based grid/flex rather than media-query breakpoints. The motion system defaults to `ease`, a gentle cubic-bezier, without custom durations or springs—reinforcing a calm, measured interaction style.

## 1. Visual Theme & Atmosphere

The design exudes **trustworthy minimalism**. Black-on-white is the most legible, most "official" color pair—it recalls printed financial documents, tax forms, and legal contracts. There are no gradients, patterns, or decorative elements in the token set. The atmosphere is businesslike, focused, and unambiguous. This is not a playful or expressive brand; it is a utility that gets out of the way so users can manage money and data with confidence.

Ramp's interface likely feels sparse compared to trendy SaaS competitors. That sparseness is a feature: it communicates that the product is mature, audited, and not chasing aesthetic trends. Financial decision-makers expect sobriety.

## 2. Color System

**Primary:** `#000000` (pure black)  
**On-primary:** `#ffffff` (pure white)  
**Text:** `#000000`

This is the simplest possible color system—a true monochrome palette with no secondary, accent, or semantic colors (warning red, success green, etc.) recorded. In practice, Ramp almost certainly uses a broader palette on-site (likely grays for UI chrome, possible accent colors for CTAs or alerts), but the measured tokens capture only the dominant axes.

The purity of black and white suggests:
- **No color as information:** Semantic meaning (error, success, info) likely relies on text labels, icons, or patterns rather than hue.
- **Universal accessibility:** Monochrome is immune to color-blindness concerns and reads well under various lighting and device conditions.
- **High contrast by default:** Every UI element will meet or exceed AA contrast standards with this pair.

## 3. Typography

**System-ui sans-serif** across all scales. This is a modern best practice: the OS provides the most legible, fastest-loading typeface for the platform (SF Pro on macOS/iOS, Segoe UI on Windows, Roboto on Android, fallback to generic sans-serif). No bespoke font file is served.

**Four roles:**

| Role | Size | Weight | Line-height | Purpose |
|------|------|--------|-------------|---------|
| **Display** | 48px | 700 | 1.5 | Hero statements, page titles, primary CTAs |
| **Heading** | 32px | 600 | Section headers, card titles |
| **Body** | 16px | 400 | 1.5 | Body text, explanations, form labels, microcopy |
| **Mono** | 13px | 400 | 1.5 | Account numbers, invoice IDs, code snippets, numeric data |

The 1.5 line-height everywhere ensures breathing room in dense layouts. The weight progression (400 → 600 → 700) creates hierarchy without introducing new typefaces. The mono layer signals that Ramp deals in data and numbers—a symbolic nod to precision.

## 4. Components & Patterns

Given the minimal token set, component design likely follows these principles:

- **Buttons:** Solid black background, white text, no shadow or 3D effect. Hover state probably uses opacity or a slightly lighter gray. Focus state relies on outline (see Accessibility).
- **Inputs & Forms:** Border-based (likely 1–2px gray stroke), no radius. Monospace may be used for numeric or code inputs to reinforce precision.
- **Cards & Containers:** White background with a light gray border (not recorded, but inferred). No drop shadow—flat design.
- **Lists & Tables:** Alternating row backgrounds (white and a light gray) for scanability. Borders and spacing, no color cues.
- **Modals & Overlays:** Likely a semi-transparent dark overlay (opacity on black) for focus.

All components inherit the 8px grid for padding and margins, enforcing visual cohesion.

## 5. Spacing & Layout

**Base unit:** 8px  
**Scale:** [8] (only one value recorded, implying 8px increments: 8, 16, 24, 32, 40, 48, etc.)

Every padding, margin, gap, and inset is likely a multiple of 8px. This is strict modular design. A form field might have 8px padding inside, 16px margin below, and 24px gap between columns. The rhythm is predictable and scannable.

The absence of custom breakpoints suggests Ramp uses **fluid responsive design** (% widths, flexbox, CSS Grid) rather than discrete breakpoints. Or, breakpoints are handled client-side by the CMS/framework and not exposed as design tokens. Either way, the layout scales smoothly across screen sizes.

## 6. Motion & Interaction

**Easing:** `ease` (CSS standard cubic-bezier approximating ease-out)

Only one motion token is present. This implies:
- **Minimal animation:** Ramp is not an animation-heavy product. Transitions are there but understated.
- **Default cubic-bezier:** `ease` (roughly `cubic-bezier(0.25, 0.1, 0.25, 1.0)`) is smooth and felt as natural, not bouncy or snappy.
- **No custom durations recorded:** Durations (200ms, 300ms) are likely baked into component code rather than tokenized, or follow a simple rule like "200ms for opacity, 300ms for transform."

Interactions feel calm and deliberate. When a modal opens, a dropdown expands, or a row highlights, the motion is gentle and does not distract from content.

## Accessibility

### Contrast Ratios

**Text on background:** Black (`#000000`) on white (`#ffffff`) = **21:1 contrast ratio**

This far exceeds WCAG AA (4.5:1) and WCAG AAA (7:1). Every text element will be readable by users with low vision or color blindness.

**Inferred UI elements:**
- Black button text on white background: 21:1 ✓
- Medium gray UI chrome (e.g., `#666666`) on white: ~7:1, meets AAA ✓
- Light gray backgrounds (e.g., `#f5f5f5`) with black text: 17:1+, exceeds AA ✓

### Minimum Requirements

- **Touch target:** 44×44px minimum. Buttons and interactive elements should be sized or padded to meet this. An 8px spacing grid easily accommodates 44px (5.5 × base unit); form fields and buttons will likely be 40–48px tall.
- **Focus indicator:** Ramp should render a 2px outline (black or a high-contrast color) with 2px offset on keyboard navigation. This is critical for financial workflows where users may be using assistive tech or keyboard-only input. The outline should be visible around buttons, inputs, and links.

### Additional Notes

- **Semantic HTML:** With a monochrome palette, semantic meaning relies on proper heading hierarchy (`<h1>`, `<h2>`, etc.), ARIA labels, and descriptive link text. Ramp must ensure form labels are properly associated (`<label for="…">`).
- **Color + text:** Any alerts or status messages (error, success, warning) must use both color (once added to the palette) *and* text or icons to communicate intent, not color alone.
- **System fonts:** System fonts render sharply on all devices and are unlikely to have rendering bugs that harm accessibility.

# Master Prompt — Build CredLink Frontend v2

You are the senior product designer, UX architect, and frontend engineer responsible for building **CredLink Frontend v2**. The existing project is already substantially implemented. Your job is not to blindly replace it or invent a new product. First understand what exists, then build a polished, production-minded frontend using realistic dummy data, with backend integration explicitly out of scope for this phase.

## 0. Non-negotiable constraints

1. **Frontend only. No backend integration in this phase.** Do not modify backend source, database schemas, migrations, API behavior, authentication services, or server configuration.
2. Use dummy/mock data and a clear mock-service/data-adapter boundary so the UI can later be connected to real APIs without rewriting components.
3. Before implementation, inspect the existing frontend, its routes, components, types, expected backend data, and the available API contracts. Understand what data the current frontend expects and what the backend actually returns, but do not call or modify the backend.
4. Follow `frontend-v2/docs/design/DESIGN.md` as the visual and interaction source of truth. If the file is named differently, locate the design specification in that directory and read it fully.
5. Preserve the existing frontend. Do not delete, rename, or rewrite existing application files unless a migration plan is necessary and explicitly documented. Build v2 in its own `frontend-v2/` directory.
6. No emojis anywhere in the UI, copy, icons, empty states, mock data, or documentation examples. Use Lucide or another consistent icon library.
7. No generic AI-generated design patterns: no gratuitous purple gradients, glowing blobs, decorative sparkles, random floating cards, excessive pills, glassmorphism, or animation for animation's sake.
8. Do not claim a feature is implemented if it is only a mock. Label demo content and keep behavior honest.
9. Do not ask for confirmation for routine implementation decisions. Make careful, documented choices and continue. Ask only if a destructive action or genuinely blocking ambiguity arises.
10. Keep the code typed, accessible, responsive, maintainable, and easy for another team member to understand.

## 1. Phase 1 — Repository and product reconnaissance (read-only)

Before coding, inspect the repository systematically.

### Inspect at minimum
- Root README and all product/architecture/design documentation.
- Existing frontend directory structure and every route/page.
- Layouts, navigation, shared components, styles, tokens, fonts, icons, animations, and responsive rules.
- Frontend package manifest, lockfile, TypeScript configuration, linting, formatting, and build scripts.
- Existing frontend types/interfaces and mock/fixture data.
- API client, fetch wrappers, hooks, query keys, and all backend endpoint references.
- Backend route/controller/validator/type definitions only to understand contracts and data shapes. Read-only; do not modify backend.
- Existing screenshots or design references under `frontend-v2/docs/design/`.

### Produce a concise internal inventory before implementation
Create `frontend-v2/docs/FRONTEND_RECONNAISSANCE.md` containing:
- Existing product areas and user roles.
- Existing routes and what each route does.
- Current frontend architecture and reusable components.
- Data currently displayed and where it originates.
- Backend endpoints the current UI references, including expected request/response shapes where discoverable.
- Mismatches, missing fields, hardcoded assumptions, and unclear behavior.
- Which flows can be represented faithfully with dummy data.
- Recommended v2 information architecture.
- Files/directories that will be created in v2.
- Any risks or unresolved product questions.

Do not turn this reconnaissance into a backend audit or start fixing backend issues. The purpose is to inform the frontend design and mock data.

## 2. Product understanding

CredLink is a network for issuing, managing, sharing, and verifying credentials across life stages and institutional domains such as Education, Employment, Finance, and Healthcare.

The product story is not “a dashboard for digital identity.” It is:

**People should not have to repeatedly chase institutions or expose entire documents just to prove one fact. CredLink helps institutions issue verifiable credentials and lets people authorize purpose-specific sharing so recipients can verify relevant claims.**

The current implementation may not support every aspirational capability described in marketing materials. Verify the actual code and documentation before presenting a feature as real. Use accurate wording around consent, verification, trust registry, revocation, auditability, decentralization, and cryptographic privacy.

## 3. Visual direction

Create a distinct hybrid design inspired by principles from Apple, Linear, Stripe, Notion, Vercel, GOV.UK, Wise, and Figma—without copying any one company.

The result should feel:
- Calm and premium, with soft edges and generous but purposeful whitespace.
- Editorial and story-driven on marketing pages.
- Precise, information-dense, and task-oriented inside the portal.
- Trustworthy and human, never sterile or overhyped.
- Modern SaaS, but not a generic SaaS template.

Use the design system in `frontend-v2/docs/design/DESIGN.md` for:
- Color tokens and semantic colors.
- DM Sans display typography, Inter UI/body typography, and IBM Plex Mono for identifiers (or documented, justified alternatives if font constraints require it).
- Spacing, grid, radius, elevation, iconography, and component states.
- Motion tokens and reduced-motion behavior.
- Landing page narrative.
- App shell and page-specific UX.
- Accessibility and responsive requirements.

Use CSS variables/design tokens as the single source of truth. Avoid scattered arbitrary hex values and one-off spacing values.

## 4. Technology expectations

Use the existing repository's package manager and conventions where practical. For `frontend-v2`, use:
- Next.js with App Router.
- TypeScript in strict mode.
- Tailwind CSS for styling, with a small, coherent token layer.
- Framer Motion / Motion for React for subtle purposeful transitions.
- GSAP only if a specific sequence genuinely benefits from it; do not add both animation libraries by default.
- Lucide React for icons.
- A suitable accessible component foundation (e.g. shadcn/ui primitives) only where it accelerates consistent, accessible implementation. Do not let a component library dictate the visual identity.
- Zod for validating mock/form inputs where useful.
- React Hook Form only for forms with meaningful complexity.
- A charting library only if an existing product metric genuinely benefits from a chart; do not add decorative charts.
- Vitest/Testing Library or the repo's established test stack for meaningful frontend tests.

Do not install dependencies without checking existing packages and explaining why a new dependency is necessary. Do not introduce state-management complexity without a demonstrated need.

## 5. Information architecture and required screens

Build the experience around the actual user roles and flows discovered during reconnaissance. At minimum, evaluate and implement the following areas where supported by current product scope:

### Public / marketing
- Landing page with a clear narrative: familiar friction → CredLink's approach → how it works → tangible citizen value → institution value → domains → trust explained → clear CTA.
- “How it works” page or section with a clear issuer → credential → consent → verification sequence.
- Citizen and institution entry points with distinct expectations.
- Domain/use-case section for Education, Employment, Finance, and Healthcare, without implying unsupported readiness.
- Trust/security explainer using verified product facts only.
- Responsive footer and navigation.

### Authenticated portal (dummy role/context)
- Dashboard overview.
- Credential management/catalog.
- Credential detail.
- Verification center and request detail.
- Trust registry.
- Issuer directory.
- Audit/activity log.
- Role/context switching only if the existing product supports it; otherwise use a clear demo context selector that cannot be mistaken for real authentication.

Do not invent additional routes just to make the app look complete. If reconnaissance shows a different set of real features, adapt the list and document the decision.

## 6. Landing page quality bar

The landing page is the highest-priority storytelling surface.

It must answer, in order:
1. What frustrating situation does CredLink remove?
2. What changes for a person?
3. How does the process work?
4. What does the person actually see or control?
5. What does an institution gain?
6. Why should either side trust the process?
7. What should the visitor do next?

Use varied composition: a strong hero, an editorial problem section, a clear process diagram, a real-looking credential/request preview, institution workflow preview, domain examples, and a trust section. Avoid repeating the same three-card feature grid.

Write final-quality copy, not placeholder marketing language. Avoid “revolutionary,” “seamless,” “unlock,” “next-generation,” “future of identity,” and unsupported superlatives. No emojis.

## 7. Build a realistic mock-data layer

Create a centralized mock data layer with typed fixtures for:
- Institutions and issuer profiles.
- Citizens (synthetic identities only).
- Credentials and claims.
- Verification requests and requested claims.
- Consent states.
- Trust/issuer statuses.
- Audit events.
- Dashboard summaries.

Requirements:
- All sample records must be synthetic and internally consistent.
- Use stable IDs and realistic timestamps/status combinations.
- Clearly mark sample/demo content in the UI.
- Avoid contradictory states (e.g. revoked credential shown as active, request approved while consent is pending).
- Include enough varied records to exercise search, filtering, empty states, and detail pages.
- Keep fixtures separate from presentation components.
- Provide mock service functions that resemble the future data-access boundary (e.g. `getCredentials`, `getCredentialById`, `getVerificationRequests`, `getAuditEvents`) without making network calls.
- Add loading/error/empty states using controllable mock delays only if useful for demonstrating UI states; do not make the normal experience artificially slow.

## 8. UX and interaction requirements

Every visible control must do something meaningful:
- Navigation links route correctly.
- Search filters the displayed mock data.
- Filters and tabs change the results.
- Sort controls actually sort.
- Pagination or “load more” works if present.
- Detail and inspect actions open a meaningful detail view.
- Forms validate and show clear success/error feedback.
- Confirmations appear for destructive demo actions.
- Toasts are restrained, accessible, and not used for every minor interaction.
- Buttons must not be decorative or dead.
- If an action is intentionally unavailable in the demo, disable it with a clear explanation rather than pretending it worked.

Implement realistic empty, loading, error, success, disabled, and permission-denied states where relevant.

## 9. Motion and micro-interactions

Motion should be subtle, soft, and useful:
- Gentle opacity/short-distance entrance for major sections.
- Small, consistent hover/focus transitions.
- Calm menu, dialog, and disclosure transitions.
- Layout animation only when it improves continuity.
- No bouncing, springy overshoot, dramatic parallax, scroll hijacking, glowing effects, or continuous background movement.
- Respect `prefers-reduced-motion` throughout.
- Content must remain accessible and usable without motion.

## 10. Accessibility and responsive implementation

Target WCAG 2.2 AA:
- Semantic HTML and landmarks.
- Keyboard-accessible navigation and controls.
- Visible focus rings.
- Correct labels and accessible names.
- Status conveyed with text, not color alone.
- Sufficient contrast.
- Reduced-motion support.
- Screen-reader-friendly async feedback.
- Forms with associated errors and helper text.

Test responsive layouts at 360, 390, 768, 1024, 1280, and 1440 px. Mobile must be deliberately designed. Do not simply compress desktop tables and sidebars.

## 11. Implementation sequence

Work in small, reviewable stages:

1. **Reconnaissance:** finish the inventory document; do not code before understanding the existing product.
2. **Foundation:** create v2 app shell, tokens, typography, icon conventions, layout primitives, and responsive navigation.
3. **Marketing narrative:** implement the landing page and its core storytelling sections.
4. **Portal shell:** implement the authenticated/demo context and navigation.
5. **Core workflows:** credential catalog/detail, verification center/request detail, trust registry, issuer directory, audit log, dashboard—prioritized by actual product scope.
6. **Mock data and interactions:** ensure every control works with dummy data.
7. **Polish:** responsive behavior, accessibility, motion, loading/empty/error states, copy, and visual consistency.
8. **Verification:** run the available frontend lint/typecheck/test/build commands. Do not run database migrations or backend scripts. Fix frontend issues introduced by v2.
9. **Handoff:** document what is complete, what is mocked, how to run v2, the future API integration boundary, and any known gaps.

Do not attempt to implement every page in one enormous component. Use clear feature folders, shared primitives, typed models, and focused components.

## 12. Suggested project structure

Adapt to the existing repository and package manager; do not force this exact structure if a better convention already exists.

```text
frontend-v2/
  app/
    (marketing)/
    (portal)/
    layout.tsx
    globals.css
  components/
    layout/
    marketing/
    portal/
    shared/
    ui/
  features/
    credentials/
    verification/
    trust/
    issuers/
    audit/
    dashboard/
  lib/
    mock-data/
    mock-services/
    formatters/
    validators/
    utils/
  types/
  public/
  docs/
    design/
      DESIGN.md
      references/
    FRONTEND_RECONNAISSANCE.md
    FRONTEND_V2_HANDOFF.md
```

## 13. Quality gates

Before declaring completion, verify:

- [ ] Existing frontend and backend files were not modified.
- [ ] No backend calls are required to use the v2 demo.
- [ ] All routes render and navigation works.
- [ ] All visible controls have functional behavior or an honest disabled state.
- [ ] Mock data is typed, synthetic, and internally consistent.
- [ ] No emojis appear anywhere in the UI.
- [ ] No generic AI-template visuals or gratuitous gradients.
- [ ] Typography, spacing, color, radii, and motion follow the design spec.
- [ ] Landing page tells a coherent story and demonstrates the product.
- [ ] Portal pages prioritize clarity and task completion.
- [ ] Responsive behavior works at the required widths.
- [ ] Keyboard navigation, focus, contrast, and reduced motion are addressed.
- [ ] Loading, empty, error, and success states exist where needed.
- [ ] Typecheck, lint, tests, and production build pass—or failures are clearly documented as pre-existing/environmental.
- [ ] Handoff documentation explains what is mocked and how real API integration can be added later.

## 14. Final response format

When finished, report:
1. What you inspected.
2. What you built and which routes are available.
3. Key design decisions and how the landing-page story works.
4. What data and interactions are mocked.
5. How to run the v2 frontend.
6. Lint/typecheck/test/build results.
7. Known gaps and future API integration points.
8. Explicit confirmation that backend files and existing frontend files were left untouched.

# The Trustline

Phases B and C, 3 October 2026. Direction selected before application implementation.

## Reference study

Actual browser captures are in `references/`, with URLs, timestamps and observed typography in `references/observations.json`. Reviewed the three contact sheets and their constituent first/second views. This is a study of composition, not permission to reproduce any brand's identity.

| Reference / observed principle | Why it works | CredLink application / original adaptation |
|---|---|---|
| Apple home: one product carries a whole band; stark light/dark changes; brief product name and two actions | The eye understands the subject before reading details | Give the credential the scale and attention normally given to a physical product; make surface changes mark changes in the story |
| Stripe home: broad typographic opening, aligned content rails, embedded billing UI in the following scene | Complex infrastructure becomes a concrete task; visual alignment preserves continuity | Replace general feature claims with a real selection-and-receipt composition; use a connected path rather than Stripe's colored ribbon |
| Linear: minimal chrome, a close surface ladder, very restrained divider/text contrast; large editorial statement in the next section | Density feels deliberate when every alignment has a purpose | Precise portal rows, quiet metadata, one clearly ranked action. Its animated hero did not settle in the capture, so no claim is made about its hero animation |
| Framer: large framed product demonstration under a short, left-aligned heading; workflow examples shown spatially | An interface becomes the visual protagonist | One credential keeps its shape while its state and surrounding context change; avoid the reference's glowing chat aesthetic |
| Vercel: asymmetric three-part opening, a strong central symbol, product scene anchored to the same rails | A technical idea has an immediately recognizable silhouette | Use a bespoke linked-C imprint and clear issuer/person/verifier anchors; preserve evergreen identity instead of monochrome developer styling |
| Raycast: highly economical central promise, isolated product silhouette, almost invisible chrome | Personality comes from focus and confident editing | A memorable credential print pattern and tactile action feedback; no red neon or desktop-launcher imitation |
| Awwwards animation gallery: visible examples including Weabers place a product artifact across a bold compositional field | One unusual spatial relationship can carry a scene | Limit perspective to the credential artifact; use real state transitions rather than arbitrary parallax |
| Godly: editorial type experiments sit alongside composed interface details | A small interaction can become the memorable idea | Put craft into claim toggles and the receipt, not a collection of visual effects |
| Minimal Gallery: very different art directions remain legible in compact previews | A coherent silhouette and decisive scale survive small screens | Preserve the hero's artifact and headline at 375px; remove spatial complexity, not the central idea |
| SiteInspire: HRS Connect uses connected lines as the subject of its composition; Cactus uses a composed image field | A subject-derived motif is more distinctive than decorative filler | Derive our path from actual issuer → holder → consent → verifier relationships; use neither their multicolor line identity nor image collage |
| Lapa Ninja | Cloudflare blocked the page | Access attempt recorded; no design observations attributed to it |

The supplied DESIGN-linear, DESIGN-stripe, DESIGN-vercel, DESIGN-mercury and DESIGN-ramp analyses were also reviewed. Their brand-specific rules are reference data, not CredLink requirements. Live sites have changed since those analyses; observed captures take precedence for research claims.

## Three directions explored

### A. The credential atelier

Museum-like white space, oversized certificate typography, seal details, a restrained document reveal.

```
short title            concise invitation
            large engraved credential
source ---------------------- recipient
```

Strong authenticity and artifact quality. Risk: becoming too archival, formal or static.

### B. The Trustline — selected

A living connection links recognizable records, people and institutions. Large type opens onto a full-width product stage. Pale celadon changes to deep evergreen for the transformation and verification acts. The credential is the visual constant.

```
confident typographic statement     two actions
institution ------- [credential] ------- recipient
scattered records -> connected path -> consent -> proof
```

Best combination of immediate comprehension, motion potential, brand distinctiveness and practical portal continuation. Borrow the tactile artifact detail from A, not its certificate-first typography.

### C. Chapters of a life

A vertical editorial timeline connects education, work and later applications, with quieter product inserts.

```
education     | credential
employment    | consent
next chapter  | verification
```

Human and approachable. Risk: looks like a career timeline, implies universal readiness across domains, and hides the institution's role. Do not pursue.

## Visual system

- Evergreen `#163D30`: primary brand surface and action.
- Deep evergreen `#102D24`: cinematic transformation and verification stages.
- Celadon `#EAF1E9`: product stage and positive spatial context.
- Paper `#FCFDFC`: credential and task surfaces.
- Ink `#172D23`: high-contrast text.
- Fern `#5B6D61`: secondary text. Test actual combinations.
- Existing warning, danger and information colors remain semantic, never domain decoration.

Typography: self-hosted Onest variable for confident display and precise interface text. Newsreader appears only on the credential's award title, a deliberate reference to the material being represented. IBM Plex Mono is limited to actual identifiers. These are documented alternatives to the recommended DM Sans/Inter pairing, chosen from locally available open-source fonts and bundled with their licenses. No runtime font service or build-time remote font dependency.

Display 76–100px desktop, 44–52px mobile; interface 14–16px; short heading measures. Avoid uppercase marketing eyebrows and accenting individual headline words. Use wide composed scenes rather than repeated card grids. Keep borders functional and vary radius by hierarchy (8px controls, 12px work surfaces, 20px product stage).

Signature assets: interlocking C mark, a deterministic fine-line credential imprint, a continuous issuer-to-verifier path, document fragments derived from actual domains, a claim receipt and an ordered verification ledger. All SVG/HTML; no stock imagery, decorative orbs or generated raster art.

## Landing experience architecture

Copy budgets include headings and support, but not necessary product values or functional control labels.

| Act | Purpose / one message | Visual and interaction | Transition | Copy budget |
|---|---|---|---|---|
| Opening: Proof that moves with you | Explain the network in five seconds | Full-width credential stage; issuer and recipient anchors; inspect the proof through a deliberate control | The path continues into the record landscape | ≤8 headline words; ≤16 support words; two CTAs |
| Disconnected → connected | Records can move beyond separate systems | Four domain documents converge into one connected composition as the visitor scrolls | The joined path becomes a lifecycle | Two short state headings; one optional sentence ≤12 words |
| Issued → held → consent → verified | These are four distinct stages | One artifact, four keyboard-operable stage controls and a changing receipt | Consent stage invites closer inspection | One heading ≤8 words; one stage sentence ≤12 words |
| Your choice | Approve only the requested claims you choose | Claim selection alongside recipient view; approval releases only the selected values | A separate verifier action remains visible in the next act | Heading ≤6 words; support ≤12 words |
| Evidence | Presence, signature, issuer trust and lifecycle are different checks | Interactive verification ledger; active, revoked and suspended examples; ordered check results | A completed receipt leads to the invitation | Heading ≤7 words; support ≤14 words |
| Invitation | Enter the product | Single decisive demo CTA and a concise institution entry | Brand wordmark and short navigation footer | Heading ≤9 words; no paragraph |

Detailed trust boundaries, server-held records, current `did:key` scope and known API inconsistencies belong on `/trust` and `/how-it-works`, not repeated in the landing narrative. The demo scenes are visibly labelled. “Held” means a record in CredLink, not device custody or an offline wallet.

## Portal architecture

Preserve the existing working routes and add clear routes for active sharing, standalone verification and onboarding where supported. Keep `/portal/verification` and its detail routes as compatible request URLs. `/demo` is the explicit role selector; `/login` and `/register` retain honest preview-only behavior. No real sessions, backend calls or automatic mock fallback.

One shell, with capability-filtered navigation, distinct citizen/institution/admin overviews, an evergreen sidebar, quiet demo label, current role/organization, useful empty/error states and immediate actions. The credential language carries into catalog/detail and consent. Portal transitions remain short; no pinned scenes or marketing choreography inside workflows.

Reconcile the draft's stale contracts: consent has no persisted `consumedAt`; canonical accreditation is `accredited_for`; IDs must be deterministic UUIDs; list scopes must not expose unrelated credentials simply because a request exists; mutations use a shared isolated preview store across persona switches; expiry is derived against a fixed demo clock. Document real API gaps, including the legacy share-access fallback, instead of concealing them.

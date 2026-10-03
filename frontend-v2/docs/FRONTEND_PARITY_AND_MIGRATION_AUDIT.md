# CredLink — Old vs New Frontend Feature Parity & Migration Audit

**Document type:** Read-only audit + revised integration roadmap + fresh-session onboarding
**Created:** 2026-10-03
**Author:** Verification session (read-only)
**Scope:** `frontend/` (old frontend, pnpm monorepo), `frontend-v2/` (new Next.js app), `backend/` (Express + Supabase + Veramo)
**Predecessor documents:** `frontend-v2/docs/FRONTEND_V2_INTEGRATION_READINESS_AND_HANDOFF.md` (the "handoff"), `frontend-v2/docs/FRONTEND_RECONNAISSANCE.md`, `frontend-v2/docs/FRONTEND_V2_MASTER_PROMPT.md`

**Nature of the work performed:** Verification and documentation only. No source, configuration, schema, migration, dependency, or existing document was modified. This file is the only artifact created.

**Evidence labels:** **Verified** (read directly in source this session), **Partially verified** (some evidence, one or more parts not confirmed), **Inferred** (reasoned, not directly established), **Unknown** (no evidence found).

---

## 1. Executive summary

This audit re-verified the predecessor handoff against the current repository. The handoff is broadly accurate: the V2 UI layer is structurally ready, the `DataClient` seam is real and stable, and the four payload/schema mismatches it identified are genuine and still present. Two corrections to the handoff matter:

1. **The handoff's CORS finding is wrong for current code.** It claims the allow-list excludes port 3200. In fact `backend/src/app.ts` accepts **any** origin whose string contains `localhost`, `127.0.0.1`, or `vercel.app`. `http://localhost:3200` is therefore already allowed. The real, more serious issue is the opposite: the CORS policy is over-permissive substring matching on an endpoint configured with `credentials: true`, which is a security concern, not a blocker.
2. **The verification "third shape" concern is overstated.** `comprehensiveVerifySchema` is `{ credentialId?, credentialPayload?, consentId?, verifierOrgId? }`, which closely matches the V2 `VerifyInput`. What remains is a response mapper and a choice of endpoint, not a schema invention.

Confirmed blockers are the three request-payload mismatches (credential issuance, consent request, shared access) plus the complete absence of any auth/session layer and any API base URL in V2.

**Readiness classification: READY FOR INCREMENTAL INTEGRATION, AFTER CONTRACT + AUTH PREREQUISITES.**

---

## 2. Repository change check (verification item 6)

- **Verified.** Last commit is `5f3420f "frontend-v2 added"` (2026-10-03). `git status --porcelain` reports exactly one untracked entry: the predecessor handoff document itself. The tracked tree is clean.
- **Verified.** `backend/src/app.ts` was last changed in commit `bba7462` (2026-10-03 12:00:57 +0530). The handoff document file mtime is 2026-10-03 12:20:58. No backend source changed after the handoff was written.
- **Conclusion:** the handoff and reconnaissance describe the current source; there are **no post-audit code changes** to reconcile. The single discrepancy found (CORS) is an error in the handoff, not drift.

---

## 3. Old frontend — architecture and feature inventory

Location: `frontend/` — a pnpm workspace (`pnpm-workspace.yaml`), packages `apps/web`, `packages/api-client`, `packages/shared-types`, `packages/validation`. Stack: Next.js 15.5.26 (App Router), React 19, Tailwind 3.4, framer-motion, recharts, date-fns, TypeScript.

### Routes (Verified)

| Route | File | Status |
|---|---|---|
| `/` | `src/app/page.tsx` | Static landing |
| `/login` | `src/app/(auth)/login/page.tsx` (5.9 KB) | Real auth against API |
| `/register` | `src/app/(auth)/register/page.tsx` (14 KB) | Real registration |
| `/dashboard` | `src/app/(dashboard)/dashboard/page.tsx` (37.7 KB) | Real + mock fallback |
| `/credentials` | `src/app/(dashboard)/credentials/page.tsx` (34.7 KB) | Real + mock fallback |
| `/verification` | `src/app/(dashboard)/verification/page.tsx` (34 KB) | Mock-based (`MOCK_VERIFICATION_REQUESTS`) |
| `/trust-registry` | `src/app/(dashboard)/trust-registry/page.tsx` (20 KB) | Real + `MOCK_ORGANIZATIONS` fallback |
| `/audit` | `src/app/(dashboard)/audit/page.tsx` (10 KB) | Real + `MOCK_AUDIT_LOGS` fallback |
| `/organizations` | `src/app/(dashboard)/organizations/page.tsx` | **Placeholder** — re-exports the trust-registry page; no distinct functionality |

There is **no dedicated consent route** in the old frontend (Verified from the route inventory). Consent request/response logic, where present, is embedded in dashboard/verification screens.

### Authentication (Verified)

- **Token storage:** `localStorage['credlink_auth_token']` storing `session.access_token` (`useRoleContext.tsx`, `register/page.tsx`).
- **Bootstrap:** on mount, `RoleProvider` reads the stored token, calls `apiClient.setToken`, then `GET /api/auth/me`; on failure it clears the token and falls back to unauthenticated.
- **Login/logout:** `apiClient.login` stores `session.access_token`; `logout()` calls `apiClient.logout(token)` best-effort then clears storage and context.
- **Protected routes:** client-side guard in `src/app/(dashboard)/layout.tsx` — a `useEffect` redirect to `/login` when `!isAuthenticated || !currentUser`. No middleware; no server-side guard.
- **Role resolution:** `deriveUserRole(userRoleAttr, orgDomainAttr)` maps ADMIN → ADMIN, org domain college/education → COLLEGE, hospital/healthcare → HOSPITAL, bank/finance → BANK, employer → EMPLOYER, else CITIZEN. `switchRole` picks a matching membership.
- **Session refresh:** **not implemented** (no refresh-token handling anywhere; Verified by grep — `refresh_token` appears only on the `AuthSession` type).
- **Password recovery / email verification:** **not implemented**.

### PWA (Verified)

- `public/manifest.json` — name/short_name, `display: standalone`, theme `#1B6B4A`, scope `/`, icons 192/512 + maskable + logo.
- `public/sw.js` — cache name `credlink-pwa-v2`; pre-caches `/`, `/login`, `/dashboard`, icons, `/manifest.json`; network-first for navigations, cache-first for assets; **skips `/api/`**.
- `src/components/pwa/ServiceWorkerRegistration.tsx` — registers `/sw.js` on window load, logs `updatefound`.
- `src/components/pwa/PWAInstallButton.tsx` (9.5 KB) — install prompt with `localStorage['credlink_pwa_dismissed']`.
- `src/app/layout.tsx` — manifest link, apple-web-app meta, icon set, theme color, viewport.
- No push notifications, no background sync.
- **Note:** the SW pre-cache list contains `/dashboard`, which does not exist in V2; the `addAll` is wrapped in `.catch`, so a missing entry is non-fatal but logged. A V2 service worker needs its own asset list and cache version.

### Infrastructure (Verified)

- **API client:** `packages/api-client/index.ts` — `CredLinkApiClient` with `baseUrl` resolution (explicit arg → `NEXT_PUBLIC_API_URL` when non-localhost → `NEXT_PUBLIC_BACKEND_PRODUCTION_URL` → Railway default; same-origin relative calls in deployed browsers), `setToken`/`getToken`, typed response interfaces, and `ApiClientError`.
- **Proxy:** `src/app/api/[...path]/route.ts` — server-side Next route handler forwarding to `BACKEND_URL`/`NEXT_PUBLIC_BACKEND_PRODUCTION_URL`/Railway, stripping `origin`,`host`,`referer`, and returning the raw backend response. This is the same-origin workaround for CORS.
- **State:** React context (`RoleProvider`) only; no Redux/Zustand.
- **Mock fallback:** `src/lib/mockData.ts` (12.3 KB) supplies `MOCK_CREDENTIALS`, `MOCK_VERIFICATION_REQUESTS`, `MOCK_ORGANIZATIONS`, `MOCK_AUDIT_LOGS`, used when the token is absent or `'demo_token'`.
- **Tests:** `tests/api-client.test.ts`, `tests/auth-phase1.test.ts`, `tests/phase2-realm.test.ts` — script-style, no configured runner in `apps/web/package.json`.

---

## 4. New frontend (V2) — architecture and feature inventory

Location: `frontend-v2/` — Next.js App Router (React 19), Tailwind, framer-motion/lucide. 21 route files (Verified).

- **Marketing:** `/`, `/how-it-works`, `/trust`, `/demo` — fully static, no network, no env usage.
- **Auth screens:** `/login`, `/register` — present and polished but wired to the mock client only (`useDataClient().signIn`, `previewAccounts`). No real auth.
- **Portal:** `/portal`, `/portal/credentials(+new,[id])`, `/portal/verification(+new,[id])`, `/portal/issuers(+[id])`, `/portal/trust-registry`, `/portal/organizations`, `/portal/audit`, `/portal/profile`.
- **Consent surface:** no dedicated `/portal/consents` route. Consent operations are consumed inside `portal/page.tsx`, `portal/credentials/[id]/page.tsx`, `portal/verification/*` (Verified via `listConsents`/`requestConsent`/`respondConsent` call sites).
- **Data layer:** `lib/data/types.ts` (`DataClient` + all input/query types), `lib/data/index.ts` (single `createDataClient` swap point), `lib/data/mock-client.ts` (51 KB in-memory implementation), `lib/mock/fixtures.ts` (42 KB deterministic entities), `lib/demo/demo-provider.tsx` (client context supplying `useDataClient`/`useDemo`/`useActor`), `lib/demo/use-async.ts`, `lib/demo/use-query.ts`.
- **Portal layout:** `app/(portal)/layout.tsx` is a **server component** rendering `PortalShell` with **no auth guard**. Identity in V2 currently comes from the demo provider, not a session.

### DataClient seam (Verified, matches handoff §3.4)

`DataClient` declares: `signIn, register, getMe, listCredentials, getCredential, issueCredential, revokeCredential, listConsents, getConsent, requestConsent, respondConsent, revokeConsent, accessSharedCredential, verifyCredential, listOrganizations, getOrganization, createOrganization, updateOrganizationStatus, listTrustRegistry, getTrustEntry, registerTrustIssuer, updateTrustStatus, listCitizens, getProfile, updateProfile, listAuditLogs, checkHealth` — exactly as the handoff states. `createDataClient(actor)` currently always returns `createMockDataClient(actor)`. The `ActorContext` is passed in explicitly because the mock cannot derive it from a token.

### Session/type gaps (Verified)

- `SignInResult.session` is typed `null` and `mode: 'demo'`; `RegisterResult` likewise (`session: null`, `mode: 'demo'`, plus `assignedRole`/`requestedRole`/`roleDowngraded`).
- **Zero** `process.env` / `NEXT_PUBLIC_*` references anywhere in `frontend-v2` (exhaustive grep, excluding `node_modules`/`.next`/`.npm-cache`/lockfile). Only `process.cwd()` appears in `next.config.mjs`. The app cannot reach a backend today.
- No token storage, no `/auth/me` bootstrap, no logout wiring, no 401 handling, no session-expiry path.

---

## 5. Feature parity matrix

| Feature | Old Frontend Status | New Frontend Status | Backend Support | Existing Implementation to Reuse | Required Changes | Priority |
|---|---|---|---|---|---|---|
| Registration | **Real API** (`register/page.tsx`) | UI-only, mock | `POST /api/auth/register` | Old form + `RegisterInput`/role-downgrade handling; `api-client.register` | Wire DataClient; rename `requestedRole`→`role`; compute `roleDowngraded` from response `user.role` | P0 |
| Login | **Real API** | UI-only, mock | `POST /api/auth/login` | Old `RoleProvider.login`, api-client `login` | Add live `signIn`; map session; set `mode:'live'` | P0 |
| Session restore | **Real** (`/auth/me` on mount) | Missing | `GET /api/auth/me` | Old `RoleProvider` init effect | Re-implement behind DataClient in a V2 client provider; add `getMe` bootstrap | P0 |
| Logout | **Real** (best-effort) | Missing | `POST /api/auth/logout` | Old `logout()` | Add to client + a nav action | P0 |
| Token storage/refresh | localStorage access token; **no refresh** | Missing | Supabase JWT; **no refresh endpoint** | Old `apiClient.setToken` pattern | Decide storage model (localStorage vs httpOnly cookie via proxy); document no-refresh limitation | P0 |
| Protected routes | Client guard in `(dashboard)/layout.tsx` | **None** (`PortalShell` only) | n/a | Old guard logic | Add client guard in the V2 portal provider/layout | P0 |
| Role resolution | **Real** (`deriveUserRole`, `switchRole`) | Mock actor only | `/auth/me` `role` + memberships | Old `deriveUserRole`, `resolveUserFromBackend` | Port resolution into live client; normalise `organizationDomain: 'admin'` | P0 |
| Profile / account | Present in old dashboard | `portal/profile` mounted | `GET/PATCH /api/profiles/me` | Old profile handling | Map `getProfile`/`updateProfile` | P1 |
| Credential listing | **Real + mock fallback** | UI-only, mock | `GET /api/credentials` | Old list/filter logic | Live `listCredentials`; **drop `search` param** | P1 |
| Credential detail | Part of credentials screen | `credentials/[id]` | `GET /api/credentials/:id` | Old detail rendering | Live `getCredential`; confirm serialized field names | P1 |
| Credential issuance | **Real + mock fallback** | UI-only, mock | `POST /api/credentials` | Old issuance form/flow | **Contract fix:** send `issuerOrgId`, rename `expiresAt`→`expirationDate` | P0 |
| Credential revocation | In credentials/dashboard | `credentials/[id]` | `POST /api/credentials/:id/revoke` | Old revoke flow | Live `revokeCredential`; reason read back via audit (F-01) | P1 |
| Consent request | Embedded in verification flow | `verification/new` | `POST /api/consents/request` | Old request payload (already sends `requestingOrgId`) | **Contract fix:** add `requestingOrgId` to `RequestConsentInput` | P0 |
| Consent decision | Embedded | `verification/[id]` | `POST /api/consents/:id/respond` | Old `respondConsent` | Wire decisions; ensure claims subset | P1 |
| Consent revoke | Not exposed as route | Not exposed | `POST /api/consents/:id/revoke` | Old api-client method | Wire if a UI entry point is added | P2 |
| Shared access | Not exposed | `accessSharedCredential` | `POST /api/consents/share-access` | Old api-client (sends body, missing field too) | **Contract fix:** add `requestingOrgId` | P1 |
| Verification | **Mock-based** in old UI | `verification/*` | `POST /api/verification/verify-credential` (+ legacy `/api/credentials/verify`) | Old `VerificationCheckResult` type + `verifyCredentialComprehensive` client | Map richer backend report → V2 `VerificationCheck`; pick one endpoint | P1 |
| Trust registry | **Real + mock fallback** | `portal/trust-registry` | `GET/POST/PATCH /api/trust-registry*` | Old trust-registry page + api-client | Live wiring; ADMIN-only intent must be enforced server-side | P1 |
| Organization mgmt | **Placeholder** (alias of trust registry) | `portal/organizations` | `GET/POST/PATCH /api/organizations*` | Old api-client methods only | Build/verify admin approval flow | P2 |
| Audit trail | **Real + mock fallback** | `portal/audit` | `GET /api/audit-logs` | Old audit page | Live wiring; keep `search` client-side (F-12) | P2 |
| Issuer directory | Not a distinct old route | `portal/issuers` | `GET /api/trust-registry`, `GET /api/organizations` | — | Compose from trust/org data | P2 |
| Dashboard/overview | **Real + mock fallback** | `portal/page.tsx` | **No aggregate endpoint**; `/api/demo/dashboard` is broken (F-02) | Old dashboard composition logic | Compose from list endpoints client-side | P1 |
| PWA (manifest/SW/install) | **Implemented** | **Missing** | n/a | `public/manifest.json`, `public/sw.js`, `ServiceWorkerRegistration`, `PWAInstallButton`, icons | Port assets + adapt SW asset list/cache version; register in V2 layout | P2 |
| Offline behaviour | Network-first pages, cache-first assets, API excluded | Missing | n/a | Old `sw.js` | Same strategy with V2 routes | P2 |
| Push notifications | **Not implemented** | Missing | n/a | — | None | — |
| Password recovery | **Not implemented** | Missing | **No endpoint** | — | Backend + frontend work if required | — |
| Email verification | **Not implemented** | Missing | **No endpoint** | — | Backend + frontend work if required | — |

---

## 6. Authentication assessment (detailed)

### 6.1 Backend model (Verified)

`backend/src/middleware/authMiddleware.ts`:
1. Requires `Authorization: Bearer <jwt>`; 401 otherwise.
2. Verifies via `supabaseAdmin.auth.getUser(token)`; 401 on invalid/expired.
3. Loads `profiles` row; **403 if missing** (deliberately no silent downgrade).
4. **403 if `account_status === 'SUSPENDED'`.**
5. Resolves exactly **one** `organization_members` row with `status = 'ACTIVE'` via `.maybeSingle()`.
6. Sets `req.user = { id, email, role, fullName, phone, organizationId }`.

`requireRole` exists in `backend/src/middleware/roleMiddleware.ts` but is **defined and never imported or mounted** (Verified by grep across `backend/src`). Authorization is therefore enforced in service code and by RLS (7 tables, policies in migration 001). Multi-organization users cannot switch context — the middleware picks one membership.

### 6.2 Old frontend model (Verified)

Client-side only: `localStorage` access token + `/auth/me` bootstrap + `useEffect` redirect guard + React context. This is compatible in shape with the backend's Bearer model, and its `resolveUserFromBackend` already normalises missing org data for ADMIN/citizen.

### 6.3 V2 today (Verified)

No authentication exists. `app/(portal)/layout.tsx` renders `PortalShell` unguarded; the demo provider supplies a synthetic actor.

### 6.4 Compatibility conclusions

- **The old flow can work with V2's routing/state**, but it must be re-expressed inside V2's existing client-provider pattern (`lib/demo/demo-provider.tsx` is already a client context wrapping the portal). Do not duplicate auth state in a second parallel context; extend/replace the provider.
- **Do not copy the old `RoleProvider` wholesale.** Extract the *behaviour* (token set, `/auth/me` bootstrap, membership→role resolution, logout) and implement it behind `DataClient`, so the mock→live swap stays in one place.
- **Token storage decision is a prerequisite.** localStorage is XSS-exposed. The old frontend's `api/[...path]` proxy route is a reusable pattern that could hold tokens in httpOnly cookies, but the backend expects a Bearer header, so the proxy would have to attach it. This is a design decision, not a mechanical port. Do not silently introduce mock authentication or fake success states.
- **No refresh endpoint exists.** Sessions rely on Supabase JWT lifetime; the client must handle 401 by clearing session and redirecting to `/login`.

---

## 7. PWA assessment (detailed)

- The old PWA is **complete and portable**: manifest, service worker, install prompt, icons, Apple meta, viewport.
- Migration to V2 is **additive**: copy `public/manifest.json`, `public/sw.js`, icon files (`icon-192.png`, `icon-512.png`, `icon.png`, `apple-icon.png`, `favicon.ico`, logos), `components/pwa/*`, and add manifest/apple metadata to `frontend-v2/app/layout.tsx`.
- **Required adaptation:** V2 has different routes (no `/dashboard`, no `/login` in the same form) and Next static-chunk paths differ. The SW's `STATIC_ASSETS` and `CACHE_NAME` must be V2-specific, and the pre-cache list must not reference removed routes. Keep API calls excluded from caching.
- **Risks:** a stale SW from the old origin could shadow V2 during a same-origin cutover (bump the cache name and activate `skipWaiting`/`clients.claim`, as the old SW already does); SW registration should not block first render; verify installability and offline navigation explicitly.
- No push notifications exist in either frontend; the backend exposes no push infrastructure.

---

## 8. Backend compatibility findings (re-verified)

### 8.1 Contract mismatches — CONFIRMED

| # | Area | Backend (Verified source) | V2 (Verified source) | Result |
|---|---|---|---|---|
| 1 | Credential issuance | `createCredentialSchema` requires `subjectId, issuerOrgId, domain, credentialType, title, claims`; optional `expirationDate`; `.strict()` (`credential.validator.ts`) | `IssueCredentialInput` has `subjectId, domain, credentialType, title, claims, expiresAt`; **no `issuerOrgId`**, wrong expiry key | **400** — blocks issuance |
| 2 | Consent request | `requestConsentSchema` requires `citizenId, requestingOrgId, purpose`; optional `credentialId, domain, requestedClaims, expiresAt`; `.strict()` (`consent.validator.ts`) | `RequestConsentInput` omits **`requestingOrgId`** | **400** — blocks consent |
| 3 | Shared access | `shareCredentialSchema` requires `credentialId` **and** `requestingOrgId`; `.strict()` | `accessSharedCredential({ credentialId })` only | **400** — blocks selective disclosure |
| 4 | Search params | `getCredentialsQuerySchema`, `getConsentsQuerySchema`, `getTrustRegistryQuerySchema` have **no `search`** field | `CredentialQuery`, `ConsentQuery`, `TrustQuery`, `AuditQuery` all include `search` | Extra param; with Zod object (non-strict) it is ignored — filter client-side |
| 5 | Verification | `comprehensiveVerifySchema = { credentialId?, credentialPayload?, consentId?, verifierOrgId? }`; legacy `verifyCredentialSchema = { credentialId?, credentialPayload? }` | `VerifyInput = { credentialId, consentId?, verifierOrgId? }` | Schema is close; gap is `credentialPayload` support and a **response mapper**, not a new shape |
| 6 | Health | `GET /api/health` returns an **unwrapped** object `{status, service, version, timestamp, uptime, database:{status,...}}` (Verified `health.routes.ts`) | `HealthCheckResponse` expects `ApiResponse<...>` with `database` as a string union | Adapter: unwrap + map `database.status` |
| 7 | Register field | Backend expects `role` (`auth.validator.ts`) | V2 sends `requestedRole` | Adapter: rename + derive `roleDowngraded` |

### 8.2 CORS — CORRECTION to the handoff (Verified)

`backend/src/app.ts` builds a base allow-list (`FRONTEND_URL` ± scheme, the Vercel app, ports 3000/5000) **and then** accepts any origin where:

```ts
normalized.endsWith('.vercel.app') || normalized.includes('vercel.app') ||
normalized.includes('localhost') || normalized.includes('127.0.0.1')
```

with `credentials: true`.

- **Handoff claim "CORS excludes port 3200" is incorrect.** `http://localhost:3200` contains `localhost` and is allowed.
- **Real finding (security):** substring matching is over-permissive. Origins like `https://localhost.attacker.com`, `https://evil-vercel.app`, or `https://myvercel.app` are accepted on a credentialed endpoint. Recommend exact-origin matching (explicit env var for the V2 origin) instead of substring checks. This is a hardening task, not an integration blocker.

### 8.3 Other confirmed findings

- **F-02 verified:** `backend/src/routes/demo.routes.ts:35` queries `.from('consent_requests')`; the schema table is `consents`. `/api/demo/dashboard` is broken; do not use it.
- **F-07 verified:** registration downgrades ADMIN → CITIZEN (`safeRole`).
- **F-11 verified:** `OrgDomain` (`college/bank/hospital/employer/network_admin`) vs `CredentialDomain` (`education/finance/healthcare/employment`); backend returns `'admin'` for ADMIN. `CREDENTIAL_DOMAIN_BY_ORG_DOMAIN` already exists in the mock client for this.
- **F-12 verified:** audit `search` is client-side.
- **RLS / tenant isolation:** organization identity is derived from the token's single membership; any body-supplied `issuerOrgId`/`requestingOrgId` must be validated server-side against that membership (service code, since `requireRole` is unmounted).

### 8.4 Not re-verified this session (Unknown / Partially verified)

- `audit.controller.ts` query schema (`audit.validator.ts` does not exist as a separate file), `organization.validator.ts`, `profile.validator.ts`, and the full `trustService.verifyCredentialComprehensive` body were not read line-by-line.
- No endpoint was executed; no Supabase connection; no type check or build was run (read-only constraint).

---

## 9. Reusable implementation inventory

| Reuse | Source | Notes / dependencies |
|---|---|---|
| Typed API client (+ `ApiResponse`, record types, `ApiClientError`) | `frontend/packages/api-client/index.ts` | Best used as the contract reference for the live `DataClient`; adapt into `frontend-v2/lib/data/*` rather than importing the package (V2 has its own types) |
| Auth behaviour (bootstrap, login, logout, role resolution) | `frontend/apps/web/src/hooks/useRoleContext.tsx` | Port behaviour, not the module; must live behind `DataClient` |
| Server-side API proxy pattern | `frontend/apps/web/src/app/api/[...path]/route.ts` | Reusable for same-origin calls / cookie-held tokens; strips `origin`/`host`/`referer` |
| PWA manifest + SW + install UI | `frontend/apps/web/public/{manifest.json,sw.js}`, `components/pwa/*`, icons | Additive; requires V2 route/cache adaptation |
| Domain utils (badges, DID truncation, domain mapping) | `frontend/apps/web/src/lib/utils.ts` | V2 already has equivalents in `lib/format.ts`/`lib/utils.ts`; do not duplicate |
| Consent request payload shape | old `createConsentRequest` (api-client) | Already sends `requestingOrgId` — a working reference for the V2 fix |
| Verification result type | `VerificationCheckResult` (api-client) | Reference for mapping the backend report into V2's `VerificationCheck` |

**Do not copy** whole directories: the old design system, layout shell, and pages are superseded by V2's approved UI.

---

## 10. Risks and unresolved questions

**Risks**
1. Token storage model undecided; localStorage is XSS-exposed (P0 decision).
2. Over-permissive CORS substring matching on a credentialed endpoint (security).
3. `requireRole` unmounted means authorization depends on service code + RLS; any body-supplied org ID must be validated server-side.
4. No refresh endpoint — 401 must be handled gracefully.
5. Broken `/api/demo/dashboard` may be tempting to reuse; do not.
6. SW/pre-cache referencing non-existent V2 routes; stale cache on origin cutover.
7. Silent contract drift if V2 unions are widened instead of corrected (e.g. `expiresAt` vs `expirationDate`).

**Unresolved questions (human decision required)**
1. Where do tokens live — localStorage (fast) or httpOnly cookie via a Next proxy (safer)?
2. Which verification endpoint is canonical — `/api/verification/verify-credential` (recommended) or legacy `/api/credentials/verify`?
3. Is multi-organization context switching required (backend returns one membership)?
4. What production V2 origin should be added to CORS, and should substring matching be removed?
5. Is PWA/offline in scope for V2 at this stage?
6. Should password recovery / email verification be built (no backend support exists)?
7. Should `/api/demo/dashboard` be fixed or retired?

---

## 11. Revised integration roadmap

**Phase 0 — Contract freeze + decisions (no code).** Decide token storage, canonical verification endpoint, production origin, multi-org scope. Write exact contracts for issuance/consent/share-access. No files affected except planning notes.
**Phase 1 — Environment + CORS + proxy.** Add `NEXT_PUBLIC_API_BASE_URL` (or equivalent) to V2; build the real `DataClient` factory skeleton; correct the backend CORS policy to exact origins incl. the V2 dev/prod origins. Validate with `checkHealth`. Rollback: revert config; mock unaffected.
**Phase 2 — Authentication + session.** Live `signIn`/`register`/`getMe`/`logout` behind `DataClient`; client provider with bootstrap + guard; 401 handling. Validate against real accounts. Rollback: keep mock path toggleable.
**Phase 3 — Role/org context.** Map `/auth/me` → `AuthUserRecord`; normalise `'admin'`; derive actor. Validate against all six roles.
**Phase 4 — Reference data (credentials list/detail, audit, trust, orgs, profile).** Adapters + response mappers; drop unsupported `search` (client-side filter).
**Phase 5 — Contract corrections (issuance, consent, share-access).** Fix `IssueCredentialInput` (`issuerOrgId`, `expirationDate`), `RequestConsentInput` (`requestingOrgId`), `accessSharedCredential` (`requestingOrgId`). Validate with real round-trips; surface `details[]` per field.
**Phase 6 — Verification.** Map the real report into `VerificationCheck`; render every rejection reason; choose one endpoint.
**Phase 7 — Dashboard composition, revocation, org/trust admin, PWA port, end-to-end + security review.** PWA is independent and can run in parallel once auth lands.
**Validation gates:** health, sign-in, `/auth/me`, role resolution, credential list/detail, consent round-trip, verification outcomes (valid/revoked/expired/untrusted), revocation, audit entries, no cross-org access, no use of `/api/demo/dashboard`.

---

## 12. Onboarding for a fresh coding-agent session

**Start here.** This document + `FRONTEND_V2_INTEGRATION_READINESS_AND_HANDOFF.md` + `FRONTEND_RECONNAISSANCE.md` describe the current state.

**Ground truth:** the backend is the source of truth. Never invent endpoints, permissions, or capabilities. Preserve backend auth, role resolution, and organization isolation.

**What you know now:**
- V2's UI is approved; do not redesign or replace components.
- `frontend-v2/lib/data/index.ts` is the single swap point; components import `@/lib/data`.
- All data is mock today; there is no API base URL and no session handling in V2.
- Four contract mismatches are real: issuance, consent request, shared access, and the health/verification response shapes.
- CORS already allows `localhost:3200`; the issue is over-permissive substring matching, not exclusion.
- `requireRole` is unmounted; authorization is service + RLS.

**Working rules:** keep changes behind the data layer; correct types instead of widening unions; do not copy the old UI; do not enable mock auth in production paths; run the relevant checks after each change; make changes incrementally.

**First implementation steps (after approval):** Phase 0 decisions → environment + CORS fix → live health check → auth → role context → then feature wiring per §11.

**Evidence discipline:** label verified vs inferred vs unknown; if you cannot verify, say what evidence is missing.

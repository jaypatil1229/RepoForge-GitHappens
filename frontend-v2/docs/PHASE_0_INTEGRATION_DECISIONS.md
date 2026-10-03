# CredLink — Phase 0: Integration Decisions and Contract Freeze

**Document type:** Planning only. No implementation. No source, config, schema, migration, dependency, or existing document changed.
**Created:** 2026-10-03
**Scope:** `frontend-v2/` (new frontend), `frontend/` (old frontend, reference), `backend/` (source of truth)
**Predecessors:** `frontend-v2/docs/FRONTEND_PARITY_AND_MIGRATION_AUDIT.md`, `frontend-v2/docs/FRONTEND_V2_INTEGRATION_READINESS_AND_HANDOFF.md`, `frontend-v2/docs/FRONTEND_RECONNAISSANCE.md`

**Evidence labels:** **Verified** (read in source this session), **Partially verified** (some evidence, not all confirmed), **Recommended** (proposed, not yet approved), **Open** (requires human decision).

---

## 1. Finalized decisions (proposed defaults, pending human approval)

| # | Decision | Status after source verification | Notes |
|---|---|---|---|
| D1 | HttpOnly cookie session via same-origin Next.js proxy that attaches the Bearer token | **Recommended, supported by source** | Backend is Bearer-only (`authMiddleware.ts`). A Next route handler can hold the token and attach it. No cookie/CSRF code exists anywhere today. |
| D2 | `POST /api/verification/verify-credential` is the canonical verification endpoint | **Verified as the richer endpoint** | `verification.routes.ts` + `trust.controller.verifyCredentialComprehensive`. Legacy `/api/credentials/verify` exists and is less capable (`credential.controller.verify`). |
| D3 | Keep the backend single-active-membership model; no frontend-only org switching | **Verified** | `authMiddleware` uses `.maybeSingle()`; `auth.service` uses `memberships[0]`. Multi-org switching is not supported server-side. |
| D4 | Replace CORS substring matching with exact-origin allow-listing | **Verified problem, hardening required** | `app.ts` accepts any origin containing `localhost`/`127.0.0.1`/`vercel.app` with `credentials: true`. Note: with D1 (same-origin proxy) the browser never calls the backend directly from V2, so CORS no longer blocks V2 — but the permissive rule remains a live exposure for direct callers. |
| D5 | Include the teammate PWA implementation in V2 migration scope | **Verified assets exist** | `frontend/apps/web/public/manifest.json`, `sw.js`, `components/pwa/*`, icons. Port additively with a V2 route list and cache version. |
| D6 | Defer password recovery and email verification | **Verified absent** | No backend endpoint, no frontend flow. |
| D7 | Do not use `/api/demo/dashboard`; compose the dashboard | **Verified broken** | `demo.routes.ts` queries `consent_requests`; the table is `consents`. |
| D8 | Preserve V2 UI; reuse old frontend behavior, not its design system or pages | **Verified applicable** | V2 design is approved and independent of the backend. |

**Net:** all eight proposals are consistent with current source. Two require correction to prior assumptions: D4 (the issue is over-permissiveness, not exclusion) and D2/D5 are confirmed as stated. One additional contract gap was discovered this session and is recorded in §4 (list response key names).

---

## 2. Evidence and source references

| Claim | Source |
|---|---|
| Bearer-only auth, profile + SUSPENDED checks, single membership | `backend/src/middleware/authMiddleware.ts` |
| `requireRole` defined but never mounted | `backend/src/middleware/roleMiddleware.ts`; grep across `backend/src` shows no import |
| Login/register/me response shapes and session fields | `backend/src/services/auth.service.ts`, `backend/src/controllers/auth.controller.ts` |
| Register downgrades ADMIN to CITIZEN | `auth.service.ts` `safeRole` |
| Common envelope | `backend/src/types/index.ts`, `backend/src/middleware/errorHandler.ts` |
| Field-level 400 `details[]` | `errorHandler.ts` (ZodError branch) |
| Credential schemas | `backend/src/validators/credential.validator.ts` |
| Consent schemas | `backend/src/validators/consent.validator.ts` |
| Verification schemas | `backend/src/validators/trust.validator.ts` |
| Issuance/detail/revoke/list response shapes | `backend/src/services/credential.service.ts` |
| Consent response shapes, server-side org derivation | `backend/src/services/consent.service.ts` |
| Verification report shape | `backend/src/services/trust.service.ts` (`verifyCredentialComprehensive` return) |
| Health unwrapped response | `backend/src/routes/health.routes.ts` |
| Audit response shape + ignored `search` | `backend/src/controllers/audit.controller.ts`, `backend/src/services/audit.service.ts` |
| CORS substring matching | `backend/src/app.ts` |
| V2 dev port 3200 | `frontend-v2/package.json` |
| V2 has no env usage | grep for `process.env`/`NEXT_PUBLIC` across `frontend-v2` (excl. node_modules/.next/.npm-cache/lockfile) — zero matches |
| V2 `PagedResult` uses `items` | `frontend-v2/lib/data/types.ts`, `frontend-v2/lib/data/mock-client.ts` |
| Old frontend localStorage + `/auth/me` bootstrap | `frontend/apps/web/src/hooks/useRoleContext.tsx` |
| Old frontend proxy pattern | `frontend/apps/web/src/app/api/[...path]/route.ts` |
| PWA assets | `frontend/apps/web/public/{manifest.json,sw.js}`, `frontend/apps/web/src/components/pwa/*` |

---

## 3. Authentication architecture

### 3.1 Roles and responsibilities

**Next.js proxy (route handler under `frontend-v2/app/api/...`) — Proposed**
- Sole holder of the Supabase session. Receives `access_token` only inside the server process.
- Attaches `Authorization: Bearer <token>` to every backend call.
- Owns cookie lifecycle: set on login/register, clear on logout/401.
- Enforces transport-only concerns: strips client `Cookie`, `Host`, `Origin`, `Referer`, `Authorization`, `Content-Length`, `Connection`; forwards everything else.
- Enforces CSRF and same-origin checks for state-changing methods.
- Performs no business logic, no role checks, no response reshaping beyond cookie handling.

**`DataClient` (live implementation behind `frontend-v2/lib/data/index.ts`)**
- Typed HTTP calls against same-origin `/api/...` proxy routes.
- Unwraps the backend envelope and maps response keys/shapes (see §4).
- Normalizes transport errors (`TransportError`) and HTTP errors (including the session-expired sentinel).
- Holds no token state and no React state; cookies are sent automatically by the browser.

**Frontend provider (extend `frontend-v2/lib/demo/demo-provider.tsx`; do not add a second auth context)**
- The single source of session state: `{ status: 'loading'|'authenticated'|'anonymous'|'expired', user, memberships }`.
- Runs the bootstrap on mount (`GET /api/auth/me`).
- Handles a 401 exactly once: clear state, mark `expired`, redirect to `/login`.
- Exposes `useDataClient()` bound to the current session, plus `signIn`/`signOut` actions.

**State-duplication rule:** exactly one provider owns session state. `DataClient` is stateless with respect to identity. No component reads cookies or calls `fetch` directly.

### 3.2 Cookie specification (Recommended)

| Attribute | Value | Rationale |
|---|---|---|
| Name | `cl_session` (access), optional `cl_refresh` | Separate from any old-frontend `credlink_auth_token`. |
| `HttpOnly` | true | Not readable by JS; mitigates XSS token theft. |
| `Secure` | true in production, false only for `http://localhost` dev | Required for cookie transmission over HTTPS. |
| `SameSite` | `Lax` (default) | Blocks cross-site POST CSRF while preserving top-level navigation. `Strict` is safer but can break inbound links. |
| `Path` | `/` | Whole app. |
| `Max-Age` | derived from `session.expires_at` (Supabase numeric epoch seconds) | **Verified:** `expires_at` is a number, not ISO. Compute `expires_at - now`. |
| `Domain` | host-only (omit) | Avoids sharing across subdomains. |

### 3.3 Lifecycle

1. **Initial login.** Browser → `POST /api/auth/login` (proxy). Proxy calls backend `POST /api/auth/login`; on 200 it sets `cl_session` from `data.session.access_token` and returns a sanitized body `{ user, memberships }` (tokens stripped). Provider stores user/memberships.
2. **Registration.** Same as login: proxy calls `POST /api/auth/register`, then sets the cookie from the returned session. **Verified caveat:** the register response `data.user` is the raw Supabase profile row (snake_case `full_name`) and has no `memberships`; the adapter must normalize and treat memberships as empty until `/auth/me`.
3. **Page refresh.** Provider enters `loading`; calls `GET /api/auth/me` through the proxy (cookie attached automatically). 200 → hydrate; 401 → clear cookie and state, treat as anonymous/expired.
4. **Expired token.** Backend returns 401; proxy clears the cookie and returns 401 with a machine-readable reason (e.g. `{ error: 'session_expired' }`). Provider clears state and redirects to `/login`. **There is no refresh endpoint (Verified: `auth.routes.ts`).** Sessions therefore end at access-token expiry unless refresh is added (see Open Questions).
5. **Logout.** Provider → `POST /api/auth/logout`; proxy forwards the Bearer token to the backend, then clears the cookie regardless of backend outcome. Provider clears state.
6. **Unauthorized API response.** Any proxied non-auth call returning 401/403 surfaces to the provider; 401 triggers the session-expired path once; 403 is surfaced as a normal permission error for the screen.

### 3.4 CSRF protection (Recommended)

Cookies are auto-sent, so state-changing proxied requests need protection:
- Primary: `SameSite=Lax`/`Strict`.
- Secondary: a double-submit CSRF token cookie (`cl_csrf`, non-HttpOnly) plus an `X-CSRF-Token` header, verified by the proxy for `POST`/`PUT`/`PATCH`/`DELETE`.
- Tertiary: the proxy validates `Origin` (or `Sec-Fetch-Site`) against the app's own origin and rejects mismatches.

### 3.5 What changes vs. the old frontend

The old frontend stores the token in `localStorage` and calls the API directly. D1 deliberately replaces that: tokens move server-side into cookies. The old behavior is reference material for *flow* (bootstrap → `/auth/me` → guard → logout), not code to copy.

---

## 4. API contract matrix (verified)

Common success envelope: `{ success: true, message?: string, data?: T, timestamp: string }`.
Common error envelope: `{ success: false, error: string, details?: { field, message }[] | any, timestamp }`.
Validation errors: HTTP 400 with `details[]` (Zod). `AppError`: its `statusCode`. Unhandled: 500 (message hidden in production by `errorHandler.ts`).

| Feature | Method + path | Auth | Exact request | Success response `data` | Errors | V2 adapter note |
|---|---|---|---|---|---|---|
| Register | `POST /api/auth/register` | public | `{ email, password(min 6), fullName(min 2), phone?, role? }` (`role` default `CITIZEN`; ADMIN silently becomes CITIZEN) | 201 `{ user, session }` — `user` is the raw profile row (snake_case) or a minimal fallback; `session` = `{ access_token, refresh_token, expires_at } | 400 (validation), 400 (Supabase create failure) | Send `role` (not `requestedRole`); normalize `user`; derive `roleDowngraded`; memberships omitted here. |
| Login | `POST /api/auth/login` | public | `{ email, password(min 1) }` | 200 `{ user (camelCase), session { access_token, refresh_token, expires_at }, memberships: [] }` | 401 invalid credentials, 403 profile missing/suspended | Strip tokens at the proxy; keep user+memberships. |
| Session bootstrap | `GET /api/auth/me` | bearer | — | 200 `{ user (incl. createdAt), memberships }` | 401, 403 (missing profile / suspended) | Provider bootstrap; normalize `organizationDomain: 'admin'`. |
| Logout | `POST /api/auth/logout` | bearer | — | 200 `{ success, message, timestamp }` (no `data`) | 401 | Proxy clears cookie regardless. |
| Issue credential | `POST /api/credentials` | bearer | strict `{ subjectId(uuid), issuerOrgId(uuid), domain, credentialType(min 2), title(min 2), claims(object|array), expirationDate?(ISO|null) }` — unknown keys rejected | 201 credential incl. `credentialIdUri, issuerDid, jwt, jwtHash, qrPayload, w3cCredential`, `expirationDate`, `issuanceDate`, `status` | 400 validation, 403 (not issuer member/admin) | **V2 fix:** send `issuerOrgId`; rename `expiresAt`→`expirationDate`. `domain` accepts `college|education` etc. via preprocess. |
| List credentials | `GET /api/credentials` | bearer | query `page, limit(≤50), domain, status, subjectId, issuerOrgId` — **no `search`** | 200 `{ credentials: [...], pagination }` | 400 bad query, 401 | **Map `credentials`→`items`** (V2 `PagedResult`). Drop `search`. |
| Credential detail | `GET /api/credentials/:id` | bearer | — | 200 credential (no `jwt`/`credentialIdUri`; includes `issuer`, `revocationReason`, `revokedAt`) | 400 invalid id, 403, 404 | Straight map. |
| Revoke | `POST /api/credentials/:id/revoke` | bearer | strict `{ reason(min 3) }` | 200 `{ id, subjectId, issuerOrgId, domain, credentialType, title, status:'REVOKED', revocationReason, revokedAt, updatedAt }` | 400 already revoked/bad id, 403, 404 | Reason also in audit (F-01). |
| Consent request | `POST /api/consents/request` | bearer | strict `{ citizenId(uuid), requestingOrgId(uuid), credentialId?(uuid|null), domain?(default 'all'), purpose(min 3), requestedClaims?(default []), expiresAt?(ISO|null) }` | 201 formatted consent | 400 validation, 403 org mismatch, 404 citizen/credential | **V2 fix:** add `requestingOrgId`. Server overrides it from the token membership and rejects a mismatch. |
| Consent list | `GET /api/consents` | bearer | query `page, limit(≤50), status, domain, citizenId, requestingOrgId` — **no `search`** | 200 `{ consents: [...], pagination }` | 400, 401 | **Map `consents`→`items`.** |
| Consent detail | `GET /api/consents/:id` | bearer | — | 200 formatted consent | 400 bad id, 403, 404 | Straight map. |
| Consent decision | `POST /api/consents/:id/respond` | bearer | strict `{ action: 'APPROVE'|'DENY', approvedClaims?, expiresAt? }` | 200 formatted consent | 400 (invalid action / wrong state), 403 | Matches V2 `ConsentDecisionInput`. |
| Consent revoke | `POST /api/consents/:id/revoke` | bearer | — | 200 formatted consent | 400 already revoked/bad id, 403 | Citizen-only. |
| Shared access | `POST /api/consents/share-access` | bearer | strict `{ credentialId(uuid), requestingOrgId(uuid) }` | 200 `{ credentialId, subjectId, issuer, domain, credentialType, title, status, sharedClaims, consentId, purpose, accessedAt }` | 400 validation, 403 no active consent/not a member, 404 credential | **V2 fix:** add `requestingOrgId`. Only approved claims are returned. |
| Verification | `POST /api/verification/verify-credential` | bearer | `{ credentialId?(uuid), credentialPayload?(string|object), consentId?(uuid), verifierOrgId?(uuid) }` | 200 `{ verified, verificationResult:'APPROVED'|'REJECTED', reason, mode, credentialSummary, allowedClaims, consentDetails, trustRegistryCheck{issuerDid,issuerName,trustStatus,isTrusted,accreditedFor,lastVerifiedAt}, lifecycleCheck{status,isRevoked,isExpired,issuanceDate,expirationDate}, cryptographicCheck{signatureValid,algorithm,verifiedAt} }` | 400 validation, 401 | **Rejections are HTTP 200 with `verified:false`** — not errors. Needs a mapper into V2 `VerificationCheck`. |
| Revocation (above) | — | — | — | — | — | — |
| Health | `GET /api/health` | public | — | 200/503 **unwrapped** `{ status:'ok'|'degraded'|'error', service, version, timestamp, uptime, database:{ status, latencyMs?, error? } }` | none (503 body is the same shape) | Unwrap; map `database.status` to V2's string; 503 → degraded, not failure. |
| Audit list | `GET /api/audit-logs` | bearer | query `page, limit(≤100), domain, eventType, search` | 200 `{ logs: [ { id, timestamp, eventType, action, domain, outcome, actor, actorId, organization, organizationId, targetResourceId, metadata, details } ], pagination }` | 400, 401 | **Map `logs`→`items`.** `search` is accepted but **ignored** (Verified: never applied in `audit.service.ts`) → filter client-side. |
| Profile | `GET|PATCH /api/profiles/me`, `GET /api/profiles/citizens` | bearer | (not read in full) | — | — | Partially verified; confirm before wiring. |
| Trust registry | `GET /api/trust-registry`, `POST /register`, `GET /:orgId`, `PATCH /:id/status` | bearer | `registerTrustIssuerSchema`, `updateTrustStatusSchema` | (list key not read this session) | — | Partially verified; ADMIN intent enforced in service, not by middleware. |

**Formatted consent shape (Verified, `consent.service.formatConsent`):** `{ id, citizenId, citizenName, citizenEmail, requestingOrgId, requestingOrg, credentialId, credential: { id, title, credentialType, status } | null, domain, purpose, requestedClaims, approvedClaims, status, grantedAt, expiresAt, createdAt, updatedAt }`.

---

## 5. Security considerations

1. **Over-permissive CORS (Verified).** `app.ts` accepts any origin containing `localhost`, `127.0.0.1`, or `vercel.app`, with `credentials: true`. Attackers can register domains like `localhost.attacker.com` or `evil-vercel.app`. With D1 the V2 browser traffic is same-origin and unaffected, but the rule should still be replaced with exact matches.
2. **No CSRF protection exists today (Verified).** Direct bearer-token calls are not CSRF-prone; cookie-based sessions are. D1 must add SameSite + double-submit token + Origin check.
3. **Tokens in `localStorage` today (old frontend).** D1 removes this from V2; do not carry the pattern forward.
4. **No token refresh (Verified).** 401-on-expiry must be a first-class, tested path. Users will be signed out at access-token expiry unless refresh is added.
5. **`requireRole` unmounted (Verified).** `GET /api/organizations`, `POST /api/organizations/:id/status`, trust-registry register/status-change rely on service checks only. Every phase touching admin surfaces must include a negative cross-role test.
6. **Client-supplied org identifiers.** `requestingOrgId` is validated server-side against the membership (Verified in `consent.service.requestConsent`); `credential.service.createCredential` performs a member check (line ~123) — treat as partially verified and test explicitly. Never trust the client value.
7. **Response-key confusion.** The backend returns `credentials`/`consents`/`logs`, V2 expects `items`. Incorrect mapping could silently render empty lists; the adapter must be unit-tested.
8. **Verification rejection is not an error.** 200 + `verified:false`; a naive error mapper could mislabel legitimate rejections.
9. **Proxy hardening.** Strip inbound `Cookie`, `Host`, `Origin`, `Referer`, `Authorization`, and hop-by-hop headers; never reflect raw backend errors that could leak internal detail; cap body size.
10. **Audit `search` is a no-op server-side.** Do not imply server-side search in the UI; filter client-side (already the mock's behavior).

---

## 6. Implementation sequence (dependency-ordered) with acceptance criteria

| Step | Work | Depends on | Acceptance criteria |
|---|---|---|---|
| 0.1 | Freeze this document's decisions with human sign-off | — | All Open Questions answered or explicitly deferred. |
| 0.2 | Fix contract types in `lib/data/types.ts` (issuance `issuerOrgId`+`expirationDate`; consent `requestingOrgId`; share-access `requestingOrgId`; drop `search`) | 0.1 | Typecheck passes; mock still returns `items`. |
| 1.1 | Add V2 env: proxy target (`BACKEND_URL` server-side) and public origin | 0.1 | No secrets in client bundle; `next build` config resolves. |
| 1.2 | Implement the Next proxy route + cookie set/clear + CSRF + Origin checks | 1.1 | Manual: login sets HttpOnly cookie; logout clears; POST without CSRF token from another origin is rejected. |
| 1.3 | Backend: exact-origin CORS (dev `http://localhost:3200`, `http://127.0.0.1:3200`; production V2 origin; keep existing old-frontend origins) | 0.1 | Allowed origin preflight succeeds; a look-alike origin (`localhost.evil.com`) is rejected. |
| 2.1 | Live `checkHealth` behind DataClient (unwrap + map) | 1.1 | Health renders ok/degraded; 503 does not throw. |
| 2.2 | Live `signIn`/`register`/`getMe`/`logout` + session provider + portal guard | 1.2, 0.2 | Real login; refresh persists; guard redirects when anonymous; 401 clears session once. |
| 2.3 | Role/org resolution + `'admin'` normalization | 2.2 | All six roles resolve correctly against real accounts. |
| 3.1 | Credentials list + detail + revocation | 2.3 | `credentials`→`items` mapping; filters map to supported params; 403/404 handled. |
| 3.2 | Issuance | 3.1 | Payload matches `createCredentialSchema`; field `details[]` surfaced; wrong-org rejected. |
| 3.3 | Consents: list, request, decision, revoke | 2.3 | Round-trip request→approve subset→revoke; `requestingOrgId` server-validated. |
| 3.4 | Shared access (selective disclosure) | 3.3 | Only approved claims returned; missing consent → 403. |
| 3.5 | Verification mapping | 2.3 | Valid/revoked/expired/untrusted each render a distinct outcome; no stack traces. |
| 4.1 | Dashboard composition from list endpoints | 3.1, 3.3 | No `/api/demo/dashboard`; loads within budget; empty/loading/error states. |
| 4.2 | Trust registry + organizations admin (ADMIN) | 2.3 | Non-admin receives 403 from the API and the UI reflects it. |
| 4.3 | PWA port (manifest, SW, install) | 2.2 | Installable; offline navigation works; API never cached; cache version bumped. |
| 5.1 | End-to-end + security review | all | Four real accounts; cross-org access denied by API; CSRF/cookie checks verified. |

**Minimum tests per phase (Recommended)**
- Phase 0: type-level contract tests; a mapper unit test asserting `credentials`/`consents`/`logs`→`items`.
- Phase 1: proxy unit tests (header stripping, cookie attributes, CSRF accept/reject, Origin check); CORS allow/deny tests.
- Phase 2: auth integration tests — login, refresh-bootstrap, expired token, logout, suspended account (403), missing profile (403), ADMIN downgrade on register.
- Phase 3: per-endpoint contract tests + authorization negatives (citizen cannot issue; non-member cannot request consent; wrong `requestingOrgId` → 403; cross-org credential read → 403).
- Phase 4: dashboard composition test; admin-only denial test; PWA offline/install smoke test.
- Phase 5: full lifecycle E2E plus security assertions (cookie flags, no token in responses, no `demo` endpoint use).

---

## 7. Explicitly deferred

- Password recovery and email verification (no backend endpoint).
- Token refresh (no backend endpoint; would require Supabase direct refresh or a new backend route).
- Multi-organization context switching (backend returns one membership).
- Push notifications (not implemented in either frontend).
- Wallet / citizen-held keys (no schema or API).
- Organization admin workflow beyond what the backend exposes.
- Retiring or fixing `/api/demo/dashboard`.
- Any redesign of V2 UI, or copying the old design system/pages.

---

## 8. Open questions requiring human approval

| # | Question | Impact |
|---|---|---|
| Q1 | Confirm D1 (HttpOnly cookie via same-origin proxy) over `localStorage`. | Architecture; affects every auth task. |
| Q2 | What is the production V2 origin to allow-list? (The old frontend origin is `https://cred-link-connect.vercel.app`; V2's is unknown.) | CORS + deployment. |
| Q3 | Is a token-refresh path in scope now? If yes: refresh through Supabase directly or add a backend endpoint? | Session UX; without it users are logged out at access-token expiry. |
| Q4 | Cookie `SameSite` value: `Lax` (recommended) or `Strict`? | CSRF posture vs. inbound-link behavior. |
| Q5 | CSRF strategy: double-submit token (recommended) or Origin-check only? | Security implementation scope. |
| Q6 | Confirm `/api/verification/verify-credential` as canonical and mark `/api/credentials/verify` deprecated. | Verification wiring. |
| Q7 | Is PWA in the initial V2 release or a later phase? | Scope/sequencing (D5 says in scope; timing unconfirmed). |
| Q8 | Confirm keeping the single-membership model for release 1 (D3). | Org context design. |
| Q9 | Should preview/demo mode remain available alongside live auth? | Provider design; must never silently mock production auth. |

---

## 9. Self-contained onboarding for the next session

Read the three predecessor documents plus this one. Ground truth is `backend/`. Preserve backend auth, role resolution, and tenant isolation. Keep all data access behind `frontend-v2/lib/data/index.ts`. Real production mode will use an HttpOnly cookie session maintained by a same-origin Next proxy; `DataClient` is stateless and maps backend shapes; a single React provider owns session state. Correct the four contract mismatches (issuance `issuerOrgId`/`expirationDate`; consent `requestingOrgId`; share-access `requestingOrgId`; unsupported `search`) and the response-key mismatch (`credentials`/`consents`/`logs` → `items`). Never use `/api/demo/dashboard`. Verifications that return `REJECTED` are HTTP 200. Do not implement anything until the Open Questions are answered.

---

## 10. Files created / modified

- **Created:** `frontend-v2/docs/PHASE_0_INTEGRATION_DECISIONS.md`
- **Modified:** none. No source, configuration, dependency, schema, migration, or existing document was changed. This is a planning-only artifact.

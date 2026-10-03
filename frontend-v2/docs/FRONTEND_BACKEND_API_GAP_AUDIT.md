# CredLink — Frontend ↔ Backend API Gap & Local Environment Audit

**Date:** 2026-10-03
**Mode:** Strictly read-only. No source, config, env, schema, or dependency files were modified.
**Scope:** `frontend-v2/` (the integrated UI) against `backend/` as it exists today, plus local backend URL resolution.
**Companion context:** `FRONTEND_V2_INTEGRATION_COMPLETION_REPORT.md`, `POST_INTEGRATION_BACKEND_GAP_REPORT.md` (this audit verifies and extends G1–G11 rather than restating them).

Evidence labels: **Verified** (read from source in this pass), **Runtime** (observed against a running service in this pass), **Inferred**, **UNVERIFIED**.

---

## A. Executive summary

| Metric | Count |
|---|---|
| Frontend API operations discovered | 28 |
| Backend routes matched (method + path) | 28 / 28 |
| Compatible operations | 27 |
| Operations requiring a backend change | 1 (`PATCH /api/organizations/:id/status` error handling) |
| Missing routes for a discovered operation | 0 |
| Missing backend **capabilities** behind a workflow | 1 (organization membership provisioning) |
| Incomplete / broken behavior | 1 route edge (org status 500), plus workflow limitations (no token refresh, no password/email recovery) |
| Confirmed environment/configuration issues | 0 |
| Potential environment risks | 2 (hardcoded production fallback; unused/misleading `NEXT_PUBLIC_API_URL`) |

**Local backend configuration status: CORRECT.** `frontend-v2/.env.local` defines `BACKEND_URL` and its effective value is `http://localhost:5000`. The backend is listening on `127.0.0.1:5000` and returned HTTP 200 from `GET /api/health` with `database.status = connected` during this audit (**Runtime**). Every frontend operation resolves through the same server-side helper, `backendBaseUrl()`, so auth, health, and the authenticated proxy all point at the same backend.

No frontend operation is missing a backend route. The real gaps are capability-level: account registration does not provision an organization membership, so a freshly registered non-citizen account cannot issue credentials until a membership exists (backend has no route to create one), and there is no token-refresh or password/email-recovery endpoint.

---

## B. Complete API contract matrix

Paths are the backend routes reached through the same-origin Next.js proxy (`/api/proxy/*`) or auth handlers.

| Frontend operation | Method + expected path | Actual backend route | Status | Exact gap | Required change | Priority |
|---|---|---|---|---|---|---|
| Login | POST `/api/auth/login` | `POST /api/auth/login` | COMPATIBLE | — | — | — |
| Register | POST `/api/auth/register` | `POST /api/auth/register` | COMPATIBLE (contract) / INCOMPLETE (workflow) | Response has no memberships; role may downgrade; no membership provisioned | Add membership provisioning (see C) | P1 |
| Session bootstrap | GET `/api/auth/me` | `GET /api/auth/me` | COMPATIBLE | — | — | — |
| Logout | POST `/api/auth/logout` | `POST /api/auth/logout` | COMPATIBLE | — | — | — |
| Credential list | GET `/api/proxy/credentials` | `GET /api/credentials` | COMPATIBLE | `search` ignored; `limit` capped 50 | Apply search server-side; raise/optimize cap | P2 |
| Credential detail | GET `/api/proxy/credentials/:id` | `GET /api/credentials/:id` | COMPATIBLE | — | — | — |
| Credential issuance | POST `/api/proxy/credentials` | `POST /api/credentials` | COMPATIBLE | Requires `issuerOrgId` matching actor membership | — (V2 supplies it) | — |
| Credential revocation | POST `/api/proxy/credentials/:id/revoke` | `POST /api/credentials/:id/revoke` | COMPATIBLE | — | — | — |
| Consent list | GET `/api/proxy/consents` | `GET /api/consents` | COMPATIBLE | `search` ignored; `limit` capped 50 | Apply search server-side | P2 |
| Consent detail | GET `/api/proxy/consents/:id` | `GET /api/consents/:id` | COMPATIBLE | — | — | — |
| Consent request | POST `/api/proxy/consents/request` | `POST /api/consents/request` | COMPATIBLE | Requires `requestingOrgId` matching membership | — (V2 supplies it) | — |
| Consent respond (approve/deny) | POST `/api/proxy/consents/:id/respond` | `POST /api/consents/:id/respond` | COMPATIBLE | Body is `{ action, approvedClaims?, expiresAt? }` — matches validator | — | — |
| Consent revoke | POST `/api/proxy/consents/:id/revoke` | `POST /api/consents/:id/revoke` | COMPATIBLE | — | — | — |
| Shared credential access | POST `/api/proxy/consents/share-access` | `POST /api/consents/share-access` | COMPATIBLE | Requires `requestingOrgId` matching membership | — (V2 supplies it) | — |
| Comprehensive verification | POST `/api/proxy/verification/verify-credential` | `POST /api/verification/verify-credential` | COMPATIBLE | HTTP 200 with `verified:false` is a valid rejection | — (V2 handles it) | — |
| Organization list | GET `/api/proxy/organizations` | `GET /api/organizations` | COMPATIBLE | — | — | — |
| Organization detail | GET `/api/proxy/organizations/:id` | `GET /api/organizations/:id` | COMPATIBLE | — | — | — |
| Organization create | POST `/api/proxy/organizations` | `POST /api/organizations` | COMPATIBLE | Does not create a membership for the creator (see C) | Consider membership creation | P1 |
| Organization status update | PATCH `/api/proxy/organizations/:id/status` | `PATCH /api/organizations/:id/status` | INCOMPLETE_IMPLEMENTATION | Unknown id returns 500 instead of 404; no body validator | Return 404 AppError for missing org; validate body | P1 |
| Trust registry list | GET `/api/proxy/trust-registry` | `GET /api/trust-registry` | COMPATIBLE | List key is `entries`; `search` ignored | Apply search server-side | P2 |
| Trust entry detail | GET `/api/proxy/trust-registry/:orgId` | `GET /api/trust-registry/:orgId` | COMPATIBLE | — | — | — |
| Trust issuer register | POST `/api/proxy/trust-registry/register` | `POST /api/trust-registry/register` | COMPATIBLE | — | — | — |
| Trust status update | PATCH `/api/proxy/trust-registry/:id/status` | `PATCH /api/trust-registry/:id/status` | COMPATIBLE | — | — | — |
| Citizen directory | GET `/api/proxy/profiles/citizens` | `GET /api/profiles/citizens` | COMPATIBLE | — | — | — |
| Profile read | GET `/api/proxy/profiles/me` | `GET /api/profiles/me` | COMPATIBLE | — | — | — |
| Profile update | PATCH `/api/proxy/profiles/me` | `PATCH /api/profiles/me` | COMPATIBLE | — | — | — |
| Audit log list | GET `/api/proxy/audit-logs` | `GET /api/audit-logs` | COMPATIBLE | Backend accepts `search`; V2 filters client-side | — | P2 |
| Health check | GET `/api/health` | `GET /api/health` | COMPATIBLE | Unwrapped body; 503 when degraded | — | — |

**Backend routes that exist but V2 does not use (not gaps):** `POST /api/credentials/verify` (narrow schema: `credentialId`/`credentialPayload` only), `POST /api/consents` (direct grant), `GET /api/demo/dashboard` (known broken — V2 deliberately avoids it).

---

## C. Missing backend routes / capabilities

There are **no missing routes for any V2 operation**. One workflow-critical capability has no route:

### C-1. Organization membership provisioning (proposed `POST /api/organizations/:id/members`)
- **Type:** Proposed (capability gap, not a frontend route gap).
- **Frontend feature requiring it:** New-account onboarding — register as COLLEGE/BANK/HOSPITAL/EMPLOYER then issue or request credentials.
- **Evidence (Verified):** `backend/src/services/organization.service.ts` `createOrganization` performs no membership write; a repository-wide search of `backend/src` for membership creation returns only *reads* (`authMiddleware.ts:66`, `auth.service.ts:111/181`, `audit.service.ts:34`, `consent.service.ts:361`, `credential.service.ts:266`). No application code creates a membership.
- **Consequence (Verified in source):** `credential.service.ts:84-90` and `consent.service.ts:52-58` reject actors with no active membership with HTTP 403.
- **Expected payload (proposed):** `{ userId, memberRole: 'ADMIN'|'ISSUER'|'VERIFIER'|'MEMBER' }`.
- **Expected response (proposed):** the created membership with nested organization.
- **Auth/authz (proposed):** network-admin or existing organization ADMIN; must not allow self-promotion across organizations.
- **Backend responsibility:** validate the actor may add the member, enforce single-active-membership, write the row.
- **Launch requirement:** Required (P1) for self-service onboarding. Existing seeded accounts are unaffected.
- **UNVERIFIED:** whether a database trigger or seed process grants membership on registration/org creation. Source shows no application-level write; a DB trigger cannot be confirmed from the repository. Confirm before implementing a route to avoid a duplicate mechanism.

### C-2. Token refresh (proposed `POST /api/auth/refresh`)
- Already tracked as gap **G1** in `POST_INTEGRATION_BACKEND_GAP_REPORT.md`. Confirmed again: `backend/src/routes/auth.routes.ts` exposes only register/login/logout/me; login returns `session.refresh_token` that nothing consumes.
- **Launch requirement:** Required (P1) for production UX.

### C-3. Password recovery / email verification
- Tracked as gap **G2**. No backend routes exist. **P2** (deferred by prior decision).

---

## D. Existing routes requiring changes

| Route | Current behavior | Frontend expectation | Smallest safe correction | Priority |
|---|---|---|---|---|
| `PATCH /api/organizations/:id/status` | Invalid/unknown `id` yields 500 (observed in the integration pass; controller has no not-found guard and no schema validation) | 404 for unknown org, 400 for bad body, 200 otherwise | Wrap `organizationService.updateOrganizationStatus` to throw a 404 `AppError` when the row is absent; add a Zod schema for the body | P1 |
| `POST /api/auth/register` | Creates the user; returns raw snake_case profile; no memberships; silently downgrades ADMIN→CITIZEN | A resolvable account (with role clarity) | Return the normalized profile shape and make the downgrade explicit; provision membership (C-1) | P1 |
| CORS origin check (`backend/src/app.ts:39-53`) | Allows any origin containing `localhost`, `127.0.0.1`, or `vercel.app` (substring match) | Exact allow-listing | Replace substring checks with an exact `Set` membership test; keep the explicit allow-list | P1 (security) |
| List endpoints (`credentials`, `consents`, `trust-registry`) | `limit` clamped to 50; `search` accepted but not applied | Accurate totals/search | Apply `search` server-side; document/raise the cap | P2 |
| Credential serialization | `claims` embed internal signed fields (`_w3c`, `_rawJwt`, `_issuerDid`, `_subjectDid`) | User-facing claims only | Strip `_`-prefixed keys in serialization | P2 (data hygiene) |
| Duplicate verification endpoints | `POST /api/credentials/verify` (narrow) and `POST /api/verification/verify-credential` (comprehensive) coexist | One canonical endpoint | Deprecate or clearly document the narrow route | P2 |

---

## E. Local backend URL audit

### Effective resolution chain
`frontend-v2/lib/server/backend.ts`:
- line 8: `const DEFAULT_BACKEND = 'https://credlink-20-production.up.railway.app'`
- lines 11-15: `process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_PRODUCTION_URL || DEFAULT_BACKEND`, trailing slashes stripped.

**Precedence:** `BACKEND_URL` → `NEXT_PUBLIC_BACKEND_PRODUCTION_URL` → hardcoded Railway production.

### Local environment (names only; no secret values printed)
`frontend-v2/.env.local` contains:
- `BACKEND_URL` — **configured**, effective value `http://localhost:5000` (**Verified by non-secret comparison**).
- `NEXT_PUBLIC_API_URL` — **configured**, value `http://localhost:5000`, but **not referenced anywhere in `frontend-v2`** (Verified by repo-wide search). It is a legacy variable used by the old frontend's `packages/api-client`.

`frontend-v2/.env.example` documents `BACKEND_URL=http://localhost:5000`. There is no `frontend-v2/.env` file.

### Is `localhost:5000` selected locally?
**Yes — Verified/Runtime.** `BACKEND_URL` is set and takes precedence, so `backendBaseUrl()` returns `http://localhost:5000`. Separately, `127.0.0.1:5000` is open and `GET http://localhost:5000/api/health` returned `200 {"status":"ok",...,"database":{"status":"connected"}}`.

### Do all operations share one backend?
**Verified.** `backendBaseUrl()` is the only base-URL helper. It is imported by `app/api/auth/{login,register,me,logout}/route.ts`, `app/api/health/route.ts`, and `app/api/proxy/[...path]/route.ts`. Auth, health, and the proxy therefore cannot diverge. `next.config.mjs` defines no rewrites or `env` overrides.

### Can the browser bypass the proxy?
**Verified: no.** Client-side code only issues relative same-origin requests:
- `frontend-v2/lib/data/live-client.ts:106` — `fetch(path, { credentials: 'same-origin' })` where `path` is always `/api/proxy/*` or `/api/auth/*`.
- `frontend-v2/lib/data/live-client.ts:422` — `fetch('/api/health')`.
- `frontend-v2/lib/demo/demo-provider.tsx:145,253` — `/api/auth/me`, `/api/auth/logout`.
No browser code reads a backend URL variable, and there is no Axios usage in `frontend-v2`.

### Hardcoded URL findings

| File:line | Value (purpose) | Classification | Notes |
|---|---|---|---|
| `frontend-v2/lib/server/backend.ts:8` | Railway production host — last-resort fallback | **Potential issue** | Used only when both env vars are absent. If `.env.local` is missing (fresh clone/CI/misconfigured deploy), the app silently targets production instead of localhost or failing fast. Server-side only; never shipped to the browser bundle. |
| `frontend-v2/.env.local` → `NEXT_PUBLIC_API_URL` | `http://localhost:5000` | **Potential issue (low)** | Unused by V2 and misleading; because it is `NEXT_PUBLIC_*`, any future reference would inline it into the client bundle, reintroducing a direct-to-backend path that bypasses the proxy. |
| `frontend/apps/web/src/app/api/[...path]/route.ts:6` | Railway production host fallback | Unrelated | Old frontend proxy; not used by V2. |
| `frontend/packages/api-client/index.ts:178,182-191` | Railway + `NEXT_PUBLIC_API_URL`/`localhost:5000` resolution | Unrelated | Old frontend client; browser calls the backend directly on localhost by design. |
| `frontend-v2/public/sw.js:71,88` | `fetch(request)` same-origin assets | Expected | Service-worker asset fetching; not a backend URL. |

### Confirmed vs. potential environment issues
- **Confirmed issues: 0.** Nothing currently causes V2 to use the wrong backend or to bypass the proxy in local development.
- **Potential risks: 2** (the production fallback at `backend.ts:8`; the legacy `NEXT_PUBLIC_API_URL`).

---

## F. Workflow blockers

| # | Workflow | Frontend sequence | Backend routes | Supported? | Failure point / cause |
|---|---|---|---|---|---|
| 1 | Login → bootstrap → dashboard → logout | login → me → credentials + consents + organizations + audit → logout | auth(4) + lists | **Yes** | None (**Runtime**: health/login/me/proxied reads succeeded). |
| 2 | Register → profile → role/org resolution | register → (me) → issue credential | `POST /api/auth/register` (+ C-1) | **Partial** | After register the user has **no membership**; no route provisions one. Issuing as an unaffiliated actor returns 403. Cause: missing capability (C-1), not a contract mismatch. |
| 3 | Issue → retrieve → verify credential | POST credential → GET credential → POST verification | credentials create/get + verification | **Yes**, for actors with a matching membership | Issuance requires `issuerOrgId == actor membership`; mismatch → 403 by design. |
| 4 | Request → approve/deny → read status | POST request → POST respond → GET consent | consents request/respond/get | **Yes** | Requires `requestingOrgId` matching membership; V2 supplies the active org. |
| 5 | Share → access shared credential | POST share-access → returns shared claims | consents/share-access | **Yes** | Requires `requestingOrgId` matching membership. |
| 6 | Revoke → verify revoked status | POST revoke → POST verification | credentials revoke + verification | **Yes** | Verification returns HTTP 200 with `verified:false` (revoked) — V2 treats this as a result, not an error. |
| 7 | Long session / expiry | any proxied call → 401 | none (no refresh) | **No** | Cause: missing route (C-2 / G1); user is signed out on expiry. |
| 8 | Dashboard statistics | compose from list endpoints | credentials/consents/organizations/audit | **Yes, with caveat** | `limit` capped at 50, so aggregate counts must paginate or display "50+". |
| 9 | Admin organization approval | PATCH org status | organizations/:id/status | **Yes** for valid ids | Unknown id → 500 (bad error handling). |
| 10 | Password reset | not implemented | none | **No** | Missing capability (C-3 / G2); deferred. |

---

## G. Prioritized backend implementation backlog

### P0 — Blocking
*None.* No frontend operation is blocked by a missing route or contract mismatch, and local development is correctly pointed at the backend.

### P1 — Required
1. **Membership provisioning** (C-1) — propose `POST /api/organizations/:id/members`; affected: registration/onboarding, credential issuance, consent requests; dependency: single-active-membership model; acceptance: a registered issuer account can create an org, receive a membership, and issue a credential without manual DB seeding.
2. **Organization status error handling** — `backend/src/controllers/organization.controller.ts` `updateStatus`; add a not-found guard (404) and body validation; affected: trust/admin screens; acceptance: unknown id → 404, invalid body → 400, valid id → 200.
3. **Token refresh** (C-2 / G1) — `POST /api/auth/refresh`; affected: session continuity; acceptance: an expired access token is exchanged for a new session without re-login, and refresh-token replay is rejected.
4. **Exact-origin CORS** — `backend/src/app.ts:39-53`; affected: security posture; acceptance: requests from an origin merely *containing* `localhost`/`vercel.app` are rejected.
5. **Registration response normalization** — return a stable profile shape and make the ADMIN→CITIZEN downgrade explicit; affected: registration UX; acceptance: register response matches the login/`me` user shape.

### P2 — Enhancement
6. Server-side `search` for credentials, consents, trust registry, and audit logs.
7. Raise/optimize the 50-row list cap (G9).
8. Strip `_`-prefixed internal fields from serialized credential claims (G6).
9. Consolidate/deprecate the narrow `POST /api/credentials/verify` (keep `/api/verification/verify-credential`).
10. Dashboard aggregation endpoint; retire the broken `/api/demo/dashboard` (G5).
11. Password recovery + email verification (C-3 / G2).
12. Multi-organization membership support if the product requires it (G7).

---

## H. Recommended implementation order

1. Organization status error handling (smallest, unblocks reliable admin UX).
2. Exact-origin CORS + registration response normalization (security + consistency).
3. Membership provisioning (C-1) — unblocks self-service onboarding and issuance.
4. Token refresh (C-2).
5. Server-side search + list-cap work (P2).
6. Claims hygiene + verification endpoint consolidation.
7. Dashboard aggregation endpoint.
8. Password recovery / email verification.

Dependency notes: membership provisioning (3) must land before onboarding can be considered complete; token refresh (4) is independent; search/cap work (5) depends on nothing.

---

## I. Verification checklist

**Local environment**
- Confirm `frontend-v2/.env.local` sets `BACKEND_URL=http://localhost:5000` (name only) and that no `NEXT_PUBLIC_*` backend URL is referenced by V2 source.
- Start the local backend and `GET http://localhost:5000/api/health` → 200 with `database.status = connected` (already observed).
- Confirm proxied reads reach localhost: log the resolved base URL in a dev build, or confirm `GET /api/proxy/credentials` returns the same totals as a direct localhost call.

**API tests (non-mutating unless noted)**
- `POST /api/auth/login` → 200, `data.user.role` present, no `access_token` in the V2 response.
- `GET /api/auth/me` → 200 after login; 401 after logout.
- `GET /api/credentials`, `/api/consents`, `/api/trust-registry`, `/api/audit-logs`, `/api/profiles/citizens` → 200 with expected list keys.
- `PATCH /api/organizations/<unknown>/status` → 404 (after fix).
- `POST /api/verification/verify-credential` on a revoked credential → 200 with `verified:false`.

**Workflow tests**
- Register a new issuer → create an organization → confirm a membership exists → issue a credential → verify it.
- Request consent → approve with a claim subset → access the shared credential → revoke → confirm access is denied.
- Let an access token expire → confirm refresh (after C-2) or a clean sign-out with a clear message (current behavior).

---

## J. Confirmed vs. unverified findings

**Source-verified**
- 28 frontend operations map to existing backend routes with matching schemas (validators read directly: `auth`, `credential`, `consent`, `trust`, `organization`, `profile`).
- `respondConsent` body `{action, approvedClaims?, expiresAt?}` matches `respondConsentSchema` exactly.
- All V2 client calls are same-origin; no V2 code reads a backend URL in the browser.
- `backendBaseUrl()` is the sole resolution helper and is shared by auth, health, and proxy routes.
- No application-level membership creation exists in `backend/src`.

**Runtime-observed**
- Local backend reachable at `127.0.0.1:5000`; `/api/health` → 200, DB connected.
- `.env.local` `BACKEND_URL` resolves to localhost:5000.

**Inferred**
- The production fallback at `backend.ts:8` would be selected if `BACKEND_URL` is unset; not exercised locally.

**UNVERIFIED / requires manual or DB-level confirmation**
- Whether a database trigger grants a membership on registration or organization creation (cannot be confirmed from the repository).
- Behavior of the `PATCH /api/organizations/:id/status` 500 endpoint against the *running local* backend (observed against the production backend in the prior pass).
- End-to-end browser UI behavior for each role (not exercised in this read-only audit).
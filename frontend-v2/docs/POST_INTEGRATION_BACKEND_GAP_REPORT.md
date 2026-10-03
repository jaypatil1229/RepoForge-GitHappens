# CredLink — Post-Integration Backend Gap Report

**Created:** 2026-10-03
**Source:** Frontend V2 integration pass (read-only against the backend). The backend was **not modified**.
**Evidence:** findings below were confirmed either in backend source during this integration or by live calls from Frontend V2 through its proxy against the running backend (`https://credlink-20-production.up.railway.app`).

Labels: **Verified** (observed directly), **Observed** (seen in a live call, cause not fully diagnosed), **Recommendation** (proposed change).

---

## 1. Summary

The backend supports the core lifecycle V2 needs. The integration did not require any backend change. The gaps below are ordered by release impact; none blocked the V2 integration itself, which adapts to the existing contracts.

| # | Gap | Type | Priority |
|---|---|---|---|
| G1 | No token refresh endpoint | Blocker for production UX | High |
| G2 | No password recovery / email verification | Blocker for production | High |
| G3 | `requireRole` middleware defined but never mounted | Security review | High |
| G4 | CORS uses substring origin matching | Security | High |
| G5 | No dashboard aggregation endpoint; `/api/demo/dashboard` is broken | Enhancement | Medium |
| G6 | Credential `claims` embed internal/signed fields (`_w3c`, `_rawJwt`, …) | Data hygiene / security | Medium |
| G7 | Single active organization membership only | Limitation | Medium |
| G8 | List `search` parameter accepted or ignored, never applied | Enhancement | Medium |
| G9 | List `limit` caps (50 for credentials/consents/trust) undercount dashboards | Enhancement | Low |
| G10 | Registration response shape differs from login (raw snake_case, no memberships) | Consistency | Low |
| G11 | `PATCH /api/organizations/:id/status` returned 500 for an unknown id | Observed | Low |

---

## G1 — No token refresh endpoint (Verified)

- **Feature:** Session continuity.
- **Current behaviour:** `backend/src/routes/auth.routes.ts` exposes only `register`, `login`, `logout`, `me`. Login returns `session.refresh_token`, but nothing can exchange it. `authMiddleware` rejects expired access tokens with 401.
- **Limitation observed:** Live login succeeds and the access token is stored in the V2 HttpOnly cookie with `max-age = expires_at − now`. When it expires, V2 must sign the user out and redirect.
- **Evidence:** source read of `auth.routes.ts`; live login response contains `refresh_token`; no route consumes it.
- **User impact:** Users are signed out whenever the access token expires, with no silent renewal.
- **Proposed change:** Add `POST /api/auth/refresh` accepting the refresh token (or enable Supabase refresh in a trusted server context) and returning a new session.
- **Classification:** Blocker for production UX. **Dependencies:** none. **Priority:** High.

## G2 — Password recovery and email verification (Verified)

- **Current behaviour:** No endpoints exist for password reset or email verification. Registration auto-confirms email (`email_confirm: true`).
- **Evidence:** route inventory; `auth.service.registerUser`.
- **User impact:** No self-service account recovery; support-only process.
- **Proposed change:** Add reset-request/reset-confirm endpoints and (optionally) verification emails.
- **Classification:** Blocker for a public production launch. **Priority:** High.

## G3 — `requireRole` unmounted (Verified)

- **Current behaviour:** `backend/src/middleware/roleMiddleware.ts` defines `requireRole`, but a repository-wide search finds no import or route usage. Authorization is enforced in services and by RLS.
- **Impact:** Every endpoint that must be admin-only (organizations, trust registry) relies on service-level checks. A missed check is a silent privilege escalation.
- **Evidence:** `backend/src/app.ts` mounts only `authenticateUser`.
- **Proposed change:** Mount `requireRole(['ADMIN'])` on administrative routes, or document and test the service-layer checks explicitly.
- **Classification:** Security review item. **Priority:** High.

## G4 — CORS substring matching (Verified)

- **Current behaviour:** `backend/src/app.ts` allows any origin whose string contains `localhost`, `127.0.0.1`, or `vercel.app`, with `credentials: true`.
- **Impact:** Origins such as `https://localhost.attacker.com` or `https://evil-vercel.app` are accepted. (V2 no longer calls the backend directly — it uses a same-origin proxy — but the rule remains live for direct callers.)
- **Proposed change:** Replace substring checks with an exact allow-list, including the V2 production origin, and keep the old frontend origins explicitly.
- **Classification:** Security. **Priority:** High (not a V2 blocker).

## G5 — No dashboard aggregate; demo endpoint broken (Verified)

- **Current behaviour:** There is no aggregate dashboard endpoint. `GET /api/demo/dashboard` queries `.from('consent_requests')`, but the table is `consents`, so it fails.
- **Impact:** V2 composes the dashboard from `listCredentials`, `listConsents`, `listAuditLogs`, `listOrganizations`, `listTrustRegistry`. This is correct but heavier and subject to the limit caps in G9.
- **Proposed change:** Fix or retire `/api/demo/dashboard`; optionally add a real aggregate endpoint.
- **Classification:** Enhancement. **Priority:** Medium.

## G6 — Internal fields embedded in credential `claims` (Verified)

- **Current behaviour:** Live credentials return a `claims` object that also contains `_w3c` (the full signed envelope, including the JWT), `_rawJwt`, `_issuerDid`, and `_subjectDid`.
- **Impact:** The signed token is duplicated into a display field; naive UIs would render internal keys. V2 strips keys beginning with `_` for presentation only.
- **Proposed change:** Store the W3C envelope separately from user-facing claims and return only user claims.
- **Classification:** Data hygiene / minor security. **Priority:** Medium.

## G7 — Single active organization membership (Verified)

- **Current behaviour:** `authMiddleware` resolves one membership with `.maybeSingle()`; `auth.service` uses `memberships[0]`.
- **Impact:** Users who belong to multiple organizations cannot switch context; V2 intentionally keeps the single-membership model.
- **Proposed change:** Add explicit active-organization selection if multi-org becomes a requirement.
- **Classification:** Limitation. **Priority:** Medium (product decision).

## G8 — `search` is unsupported or ignored (Verified)

- **Current behaviour:** Credential/consent/trust query schemas have no `search` field; the audit controller accepts `search` but `audit.service` never applies it.
- **Impact:** V2 performs client-side filtering and does not send `search` to endpoints that drop it.
- **Proposed change:** Implement server-side search or document the client-side contract.
- **Classification:** Enhancement. **Priority:** Medium.

## G9 — List `limit` caps (Verified)

- **Current behaviour:** Credentials, consents, and trust registry cap `limit` at 50; audit caps at 100.
- **Impact:** V2 screens that request `limit: 100` receive at most 50 rows, so dashboard counts can undercount.
- **Proposed change:** Add server-side counts or aggregate endpoints, or raise the caps for authenticated reads.
- **Classification:** Enhancement. **Priority:** Low.

## G10 — Registration response differs from login (Verified)

- **Current behaviour:** Register returns the raw profile row (snake_case `full_name`) and **no memberships**, whereas login/me return a normalized camelCase user plus memberships.
- **Impact:** V2's register route normalizes the row and treats memberships as empty until the next `/auth/me`.
- **Proposed change:** Normalize the register response to match login.
- **Classification:** Consistency. **Priority:** Low.

## G11 — Organization status update on unknown id returns 500 (Observed)

- **Current behaviour:** `PATCH /api/organizations/{unknown-uuid}/status` returned 500. V2's proxy sanitizes the message to a generic error (verified).
- **Impact:** Clients cannot distinguish "not found" from a server fault.
- **Proposed change:** Return 404 for an unknown organization.
- **Classification:** Enhancement. **Priority:** Low. (Cause not fully diagnosed; observed only.)

---

## Verified non-gaps (working as intended)

- Error envelope `{ success, error, details, timestamp }` with field-level `details[]` (validated live by an invalid issuance payload).
- Health check returns the unwrapped shape and a `degraded` status with HTTP 503; V2 handles both.
- Verification returns HTTP 200 with `verified: false` for a rejected credential (validated live on a credential with an invalid signature).
- Consent creation derives and validates `requestingOrgId` from the authenticated membership.
- Revocation and credential detail return 404 for unknown ids; CSRF-less mutations are rejected by V2's proxy (frontend concern).
# CredLink Frontend v2 - Product Reconnaissance

**Status:** Pre-implementation reconnaissance. No frontend code is defined or built by this document.
**Scope:** Reconstruct CredLink from the surviving repository so that `frontend-v2/` can be designed against real contracts.
**Author stance:** Evidence-first. Every capability below is tagged as **Verified** (present in backend source), **Assumed** (inferred, not directly guaranteed), or **Planned / Absent** (documented as future work or not present at all).

---

## 0. How this document was produced

Sources inspected (read-only; nothing outside `frontend-v2/` was modified):

- Root `README.md`.
- `backend/src` (routes, controllers, services, validators, middleware, types, config, Veramo integration).
- `backend/migrations/001_initial_schema_and_rls.sql`, `002_credential_revocation_fields.sql`.
- `backend/tests/*` (demo account checks and end-to-end lifecycle scripts).
- `frontend/` (earlier pnpm monorepo: `packages/api-client`, `packages/shared-types`, `packages/validation`, `apps/web`).
- `frontend_ins/` (earlier Next.js App Router attempt with a mock data layer; used only as an API-expectation reference).
- `frontend-v2/docs/design/DESIGN.md` and `frontend-v2/docs/FRONTEND_V2_MASTER_PROMPT.md`.

Relevant installed skills consulted for IA/UX and design grounding: `ui-ux-pro-max`, `frontend-design`, `design-system`, `brand`.

Path note: the master prompt refers to `frontend-v2/docs/design/DESIGN.md`. That is the correct location; `frontend-v2/docs/DESIGN.md` does not exist.

Semantics used throughout:

- **Verified** - the behaviour exists in backend source and is reachable through a mounted route or a service the routes call.
- **Assumed** - strongly implied by schema/naming but not enforced in code.
- **Planned / Absent** - named in `README.md` roadmap, OR not implemented anywhere; must not be presented as working in the UI.

---

## 1. Product overview

### 1.1 What CredLink actually is

CredLink is a consent-driven digital credential exchange. Institutions issue verifiable records about people; people authorize purpose- and claim-limited sharing; recipients (banks, hospitals, employers, colleges) verify issuer trust, credential lifecycle, and cryptographic integrity before acting on the claims.

The centre of gravity of the codebase is a REST API around six persisted entities:

1. **Profiles** - people and accounts, with one account role.
2. **Organizations** - institutions, each with a domain, a DID, a verification status, and issuer authorization.
3. **Organization memberships** - links a profile to an organization with a member role.
4. **Credentials** - archival credential metadata plus the signed W3C JWT, issued by an organization to a citizen.
5. **Consents** - a citizen's decision to share specific claims with a requesting organization.
6. **Trust registry** - the network's issuer trust record, keyed by issuer identifier (DID).

Audit logs are a first-class seventh entity written throughout.

### 1.2 The problem it solves

Repeated, manual, all-or-nothing document verification. A person re-requests the same transcript or certificate, exposes a whole document to prove one fact, and the receiving institution has no reliable way to check provenance or validity. CredLink's implemented answer is: issue once, verify provenance against a trust registry, require explicit consent, release only approved claims, and record every decision.

### 1.3 Intended users

- **Individuals (citizens):** hold credentials, receive sharing requests, approve or deny specific claims, revoke access.
- **Issuing institutions:** colleges, hospitals, banks, employers authorized to issue particular credential types.
- **Verifying institutions:** organizations that request consent and verify claims (often also issuers).
- **Network administrators:** govern organization approval, issuer authorization, and the trust registry; see the full audit trail.

### 1.4 Product truth vs. marketing claims

| Claim area | Verified in code | Notes |
|---|---|---|
| Role-based access control | Partially | Roles and membership checks exist, but most authorization is enforced in service logic and Postgres RLS, not on routes. `requireRole` middleware exists and is unit-tested but is not mounted on any route. |
| Credential issuance | Yes | `POST /api/credentials` produces a real Veramo W3C JWT VC (Ed25519, `did:key`) and stores it. |
| Credential revocation | Yes | `POST /api/credentials/:id/revoke` sets status REVOKED and logs the reason. |
| Consent management | Yes | Request, direct grant, respond (approve/deny), revoke, list, detail. |
| Claim-level selective disclosure | Yes | `POST /api/consents/share-access` filters claims to the approved set. |
| Verification | Yes | Two paths: basic (`/api/credentials/verify`) and comprehensive (`/api/verification/verify-credential`) with Mode A (stateless) and Mode B (consent-bound) semantics. |
| Trust registry | Yes | Admin-only registration and status change; any authenticated user can read it. |
| Audit logging | Yes | Written on issuance, revocation, consent, verification, org status change. Read is RBAC-scoped. |
| Standards-based Verifiable Credentials | Yes (narrow) | JWT VC with `did:key` via Veramo is implemented. DID resolution is limited to `did:key`; keys are in-memory unless supplied through env. |
| Citizen-held wallet | No | Absent. The credential archive is server-side; there is no wallet, no key custody by the citizen. |
| QR-based presentation | No | `qr_payload` is generated and stored, but no endpoint resolves or verifies it. |
| Zero-knowledge proofs | No | Never claim this. Verification reveals approved claims in plaintext to the verifier. |
| Email verification / password reset | No | Registration auto-confirms email; no reset flow. |
| MFA | No | Not present. |

---

## 2. Domain vocabulary (must match database CHECK constraints)

These unions are the authoritative controlled vocabulary. The UI, fixtures, and filters must not widen them.

- Account role (`profiles.role`): `CITIZEN`, `COLLEGE`, `BANK`, `HOSPITAL`, `EMPLOYER`, `ADMIN`.
- Account status (`profiles.account_status`): `ACTIVE`, `SUSPENDED`.
- Organization domain (`organizations.domain`): `college`, `employer`, `bank`, `hospital`, `network_admin`.
- Organization verification status: `PENDING`, `APPROVED`, `DENIED`.
- Member role (`organization_members.member_role`): `ADMIN`, `ISSUER`, `VERIFIER`, `MEMBER`.
- Member status: `ACTIVE`, `SUSPENDED`.
- Credential domain (`credentials.domain`): `education`, `employment`, `finance`, `healthcare`.
- Credential status: `VALID`, `REVOKED`, `EXPIRED`.
- Consent domain: `education`, `employment`, `finance`, `healthcare`, `all`.
- Consent status: `PENDING`, `APPROVED`, `DENIED`, `REVOKED`, `EXPIRED`.
- Trust status: `VERIFIED`, `SUSPENDED`, `REVOKED`.
- Audit event type: `CREDENTIAL_ISSUED`, `CREDENTIAL_REVOKED`, `VERIFICATION_REQUESTED`, `VERIFICATION_APPROVED`, `ORGANIZATION_STATUS_CHANGED`, `CONSENT_GRANTED`, `CONSENT_REVOKED`.
- Audit outcome: `SUCCESS`, `FAILURE`, `PENDING`.

### 2.1 Role-to-domain mapping (important asymmetry)

Account roles and credential domains use different words for the same institutions. The backend normalizes request input (`college` -> `education`, `hospital` -> `healthcare`, `bank` -> `finance`, `employer` -> `employment`), but responses keep the database spelling.

| Account role | Organization domain | Credential domain | Typical function |
|---|---|---|---|
| CITIZEN | (none) | (all) | Holds credentials, decides consent |
| COLLEGE | college | education | Issue / verify education records |
| HOSPITAL | hospital | healthcare | Issue / verify health records |
| BANK | bank | finance | Issue / verify financial records; common verifier |
| EMPLOYER | employer | employment | Issue / verify employment records |
| ADMIN | network_admin | n/a | Governance of orgs and trust registry |

The word "verifier" is not an account role. Any institution account can act as a verifier; the member role `VERIFIER` exists on memberships but the API does not create or manage memberships beyond the organization creator, and login returns only the first active membership.

---

## 3. Role and permission matrix

### 3.1 What each role can do (Verified)

| Capability | CITIZEN | Institution (COLLEGE/BANK/HOSPITAL/EMPLOYER) | ADMIN |
|---|---|---|---|
| Register / log in / log out | Yes | Yes | Yes (admin accounts are provisioned directly) |
| Read own profile, update name/phone | Yes | Yes | Yes |
| List active citizens (`/profiles/citizens`) | Yes (no role gate) | Yes | Yes |
| List organizations | Yes | Yes | Yes |
| Create organization (self-onboard) | Yes (no role gate) | Yes | Yes |
| Approve/deny org, set issuer + credential types | No | No | Yes |
| Issue credential | Only if own org is APPROVED issuer with ISSUER/ADMIN membership | Same | Yes (bypasses org checks) |
| Revoke credential | No | Issuer org members only | Yes |
| List credentials | Own subject credentials | Own subject + credentials issued by own org | All |
| Read a single credential | Own, or with approved consent | Own org's, or with approved consent | All |
| Request consent | No (as org) | Active member of requesting org | Yes (any org) |
| Grant consent directly | Yes (own credentials) | Not intended | Yes (bypass) |
| Respond to consent (approve/deny) | Owner only | No | Yes (bypass) |
| Revoke consent | Owner only | No | Yes (bypass) |
| Access shared credential (`share-access`) | No | Active member of requesting org + approved consent | Yes |
| Basic verification | Any authenticated user | Yes | Yes |
| Comprehensive verification | Any authenticated user | Yes | Yes |
| Read trust registry | Yes | Yes | Yes |
| Manage trust registry | No | No | Yes |
| Read audit logs | Own actor events | Own org + own actor events | All |

### 3.2 Authorization mechanisms actually in force

1. **Route level:** every non-public router applies `authenticateUser`, which verifies the Supabase Bearer JWT server-side and loads the profile. Missing/expired token -> 401. Missing profile or suspended account -> 403.
2. **Membership derivation:** `authenticateUser` attaches the first ACTIVE `organization_members.organization_id` as `req.user.organizationId`. Services re-derive and cross-check membership for writes.
3. **Service level:** the real business authorization. Examples: issuer must be APPROVED and `is_issuer`, actor must hold ISSUER/ADMIN membership, trust registry changes require `role === 'ADMIN'`, only the consent owner can respond.
4. **Database RLS:** helper functions (`is_org_member`, `is_org_admin`, `is_org_issuer`, `is_network_admin`, `has_active_consent`) plus policies. Note the backend uses the Supabase service-role client (`supabaseAdmin`), which bypasses RLS; RLS is defence-in-depth for direct/stolen-token access, not the primary API guard.

### 3.3 Notable authorization gaps / cautions (Verified)

- `requireRole` middleware is defined and tested but unused on routes.
- `GET /api/profiles/citizens` returns all active citizens to any authenticated caller, including citizens.
- `POST /api/organizations` lets any authenticated user create an organization and become its ADMIN; the org is forced to PENDING and non-issuer.
- `POST /api/consents` (direct grant) does not require the actor to be a CITIZEN; it only checks credential ownership.
- `GET /api/trust-registry` is readable by any authenticated user (intentional, but includes technical metadata).
- Credential issuance permits ADMIN to bypass org approval and issuer checks entirely.
- Login resolves only the first active membership; multi-organization users are underrepresented.
---

## 4. Data model

Verified from migrations plus service read/write shapes. Frontend types must mirror the camelCase API shapes in section 5, not the snake_case column names.

### 4.1 Tables

**profiles**
`id` (UUID, = auth user id), `full_name`, `email`, `phone`, `role` (account role), `account_status`, `created_at`, `updated_at`.

**organizations**
`id`, `name`, `code` (unique, upper-cased), `domain` (org domain), `did` (unique; system-generated `did:credlink:org:<code>` on self-registration, or a real `did:key:` for the platform issuer), `registration_ref`, `verification_status`, `is_issuer`, `authorized_credential_types` (text[]), timestamps.

**organization_members**
`id`, `organization_id`, `user_id`, `member_role`, `status`, timestamps; unique on (organization_id, user_id).

**credentials**
`id`, `subject_id` (profile), `issuer_org_id` (organization, RESTRICT), `domain`, `credential_type`, `title`, `claims` (JSONB; object or array), `issuance_date`, `expiration_date`, `status`, `issuer_signature` (the full signed JWT), `qr_payload`, `revocation_reason` (migration 002), `revoked_at` (migration 002), timestamps.

**consents**
`id`, `citizen_id`, `requesting_org_id`, `credential_id` (nullable), `domain`, `purpose`, `requested_claims` (text[]), `approved_claims` (text[]), `status`, `granted_at`, `expires_at`, timestamps. There is **no** `consumed_at` column; consumption is expressed by setting `status = EXPIRED` and `expires_at = now`.

**trust_registry**
`id`, `organization_id` (unique), `issuer_identifier` (unique; equals the organization DID), `trust_status`, `verification_metadata` (JSONB), `last_verified_at`, timestamps.

**audit_logs**
`id`, `actor_id` (nullable), `organization_id` (nullable), `event_type`, `action`, `domain`, `outcome`, `target_resource_id`, `metadata` (JSONB), `created_at`.

### 4.2 Relationships

- profile 1---* credentials (subject).
- organization 1---* credentials (issuer), 1---* memberships, 1---1 trust_registry entry.
- profile *---* organizations through memberships.
- consent joins one citizen, one requesting organization, and optionally one credential.

### 4.3 State machines (Verified)

Credential status:
```
VALID --(revoke)--> REVOKED
VALID --(date passes; computed, DB may stay VALID)--> treated as EXPIRED by verification
```
`EXPIRED` is an allowed DB value, but the code primarily derives expiry from `expiration_date` at read/verify time; a filter on `status=EXPIRED` may therefore miss date-expired records that still store `VALID`.

Consent status:
```
PENDING --respond APPROVE--> APPROVED --revoke--> REVOKED
PENDING --respond DENY-----> DENIED
APPROVED --expiry date passes--> EXPIRED (auto, on list read)
APPROVED --comprehensive verification consumes--> EXPIRED (set with expires_at = now)
```
The comprehensive verification response labels the consumed state `CONSUMED`, but the database row is `EXPIRED`. The UI must not imply a distinct persisted `CONSUMED` status; it should describe the outcome ("used once, now closed").

Organization verification status:
```
PENDING --admin APPROVE--> APPROVED --admin DENY--> DENIED (and can move back to PENDING/APPROVED)
```

Trust status:
```
VERIFIED --admin--> SUSPENDED --admin--> REVOKED   (and back to VERIFIED)
```

### 4.4 Derived / non-persisted fields observed in the API

- `subjectName` on credentials: resolved from `profiles.full_name` at list time.
- `citizenName` / `citizenEmail`, `requestingOrg`, `credential` on consents: joined and shaped by the service.
- `issuer` `{ id, name, did }` embedded on credentials.
- `actor` and `organization` display strings on audit rows.
- `totalPages` computed per page.

---

## 5. API surface (verified)

Base path `/api`. Every JSON endpoint returns the envelope
`{ success: boolean, message?: string, data?: T, error?: string, details?: { field, message }[], timestamp: string }`,
except `GET /api/health`, which returns the health object directly.

Error contract: Zod failures -> HTTP 400 with `error: "Validation Error: ..."` and `details[]`; `AppError` -> its status code with `error`; unknown -> 500 (message redacted in production). 404 returns `{ success:false, error: "Resource not found: METHOD path" }`.

### 5.1 Public

| Method | Path | Data returned |
|---|---|---|
| GET | `/api/health` | service, version, uptime, database connectivity/latency |
| POST | `/api/auth/register` | `{ user, session }` (email auto-confirmed; ADMIN request downgraded to CITIZEN) |
| POST | `/api/auth/login` | `{ user, session, memberships }` |
| GET | `/api/demo/dashboard` | aggregated demo data - see caution below |

Caution (Verified defect): `/api/demo/dashboard` queries a non-existent `consent_requests` table and maps audit fields (`user_name`, `target_resource_type`, `ip_address`) that do not exist on `audit_logs`. Consents return empty and audit display fields are undefined. Do not rely on this endpoint as a contract; treat it as a legacy demo shortcut.

### 5.2 Authenticated (Bearer Supabase JWT)

Auth and profile:

| Method | Path | Body / query | Notes |
|---|---|---|---|
| POST | `/api/auth/logout` | - | Signs out the token |
| GET | `/api/auth/me` | - | `{ user, memberships }` |
| GET | `/api/profiles/me` | - | profile record |
| PATCH | `/api/profiles/me` | `fullName?`, `phone?` | role/email/status rejected by validator |
| GET | `/api/profiles/citizens` | - | active citizens (no role gate) |

Organizations:

| Method | Path | Body / query | Notes |
|---|---|---|---|
| GET | `/api/organizations` | `page`, `limit`, `domain?` | all authenticated |
| GET | `/api/organizations/:id` | - | 400 on non-UUID |
| POST | `/api/organizations` | `name`, `code`, `domain`, `registrationRef?` | forced PENDING, non-issuer; creator becomes org ADMIN |
| PATCH | `/api/organizations/:id/status` | `verificationStatus`, `isIssuer?`, `authorizedCredentialTypes?` | ADMIN only (service check) |

Credentials:

| Method | Path | Body / query | Notes |
|---|---|---|---|
| GET | `/api/credentials` | `page`, `limit`, `domain?`, `status?`, `subjectId?`, `issuerOrgId?` | scoped by role/scope |
| POST | `/api/credentials` | `subjectId`, `issuerOrgId`, `domain`, `credentialType`, `title`, `claims`, `expirationDate?` | status is server-assigned |
| GET | `/api/credentials/:id` | - | 404/403 never leaks existence details |
| POST | `/api/credentials/:id/revoke` | `reason` (min 3) | issuer org ISSUER/ADMIN or ADMIN |
| POST | `/api/credentials/verify` | `credentialId?` or `credentialPayload?` | basic (Mode A) verification |

Consents:

| Method | Path | Body / query | Notes |
|---|---|---|---|
| GET | `/api/consents` | `page`, `limit`, `status?`, `domain?`, `citizenId?`, `requestingOrgId?` | scoped |
| POST | `/api/consents/request` | `citizenId`, `requestingOrgId`, `credentialId?`, `domain`, `purpose`, `requestedClaims`, `expiresAt?` | org member or ADMIN |
| POST | `/api/consents` | `requestingOrgId`, `credentialId?`, `domain`, `purpose`, `approvedClaims`, `expiresAt?` | citizen grants directly |
| GET | `/api/consents/:id` | - | owner, requesting-org member, or ADMIN |
| POST | `/api/consents/:id/respond` | `action` (APPROVE/DENY), `approvedClaims?`, `expiresAt?` | owner or ADMIN; only while PENDING |
| POST | `/api/consents/:id/revoke` | - | owner or ADMIN |
| POST | `/api/consents/share-access` | `credentialId`, `requestingOrgId` | returns only approved claims |

Trust registry and verification:

| Method | Path | Body / query | Notes |
|---|---|---|---|
| GET | `/api/trust-registry` | `page`, `limit`, `trustStatus?`, `domain?` | authenticated read |
| POST | `/api/trust-registry/register` | `organizationId`, `trustStatus?`, `verificationMetadata?` | ADMIN only; org must be APPROVED |
| GET | `/api/trust-registry/:orgId` | - | accepts UUID or DID |
| PATCH | `/api/trust-registry/:id/status` | `trustStatus`, `reason?`, `metadata?` | ADMIN only |
| POST | `/api/verification/verify-credential` | `credentialId?`, `credentialPayload?`, `consentId?`, `verifierOrgId?` | comprehensive (Mode A + Mode B) |

Audit:

| Method | Path | Body / query | Notes |
|---|---|---|---|
| GET | `/api/audit-logs` | `page`, `limit`, `domain?`, `eventType?`, `search?` | scoped; `search` is accepted but not applied server-side |

### 5.3 Verification response shapes (critical for UI)

Basic verification (`/api/credentials/verify`) returns:
```
{ valid, reason, applicationStatus: VALID | INVALID | NOT_FOUND | REJECTED | REVOKED | EXPIRED,
  credentialId?, credentialIdUri?, issuerDid?, subjectId?, claims?,
  cryptographicVerification: { signatureValid, algorithm, verifiedAt? , error? },
  trustRegistryCheck?: { isTrusted, status, accreditedFor? },
  lifecycleDetails?: { status, issuanceDate, expirationDate },
  revocationDetails?: { isRevoked, reason, revokedAt }, expirationDetails?: { isExpired, expirationDate } }
```

Comprehensive verification (`/api/verification/verify-credential`) returns:
```
{ verified, verificationResult: APPROVED | REJECTED, reason,
  mode?: BASIC_VERIFICATION | BANK_VERIFICATION_REQUEST,
  credentialSummary?, allowedClaims?, consentDetails?: { consentId, status: CONSUMED, consumedAt, purpose },
  trustRegistryCheck?, lifecycleCheck?, cryptographicCheck? }
```

Business rejection returns HTTP 200 with `verified:false`. Only malformed input/auth errors return non-200. The UI must render rejections as normal outcomes, not transport errors.

### 5.4 Verification decision order (Verified, both paths)

1. Cryptographic signature verification via Veramo (first; missing/failed JWT -> invalid).
2. Extract credential id and issuer DID from the *verified* VC only (never trust client input).
3. Load the archive record. Missing -> `NOT_FOUND` / `REJECTED`.
4. Trust registry lookup by issuer DID; must exist and be `VERIFIED`.
5. Domain accreditation: `trust_registry.verification_metadata.accredited_for` must equal the credential's domain, or verification is rejected.
6. Lifecycle: REVOKED rejects; past `expiration_date` rejects.
7. Mode B only (when `consentId` supplied): consent must exist, belong to the credential subject, be APPROVED, unexpired, and match the verifier org; then a three-way intersection of verified-VC claims, requested claims, and approved claims is released, and the consent is atomically consumed (`APPROVED` -> `EXPIRED`).
8. Write a `VERIFICATION_APPROVED` audit record.

Implication for mock realism: an issuer that is `VERIFIED` but whose accreditation domain differs from the credential domain must produce a rejection. This is a common, correct outcome, not a bug.

---

## 6. Core workflows

### 6.1 Institution onboarding (Verified)

1. Register an account with an institutional role (public registration; auto-confirmed).
2. Create the organization: name, code, domain. Forced PENDING, `is_issuer=false`, empty authorized types. Creator becomes org ADMIN.
3. Network admin sets organization status to APPROVED, optionally `is_issuer=true` and `authorizedCredentialTypes` (for example `Degree`, `Transcript`).
4. Network admin registers the organization in the trust registry, supplying `verificationMetadata.accredited_for` equal to the credential domain the org will issue. Without this exact value, verification of that org's credentials is rejected.

### 6.2 Credential issuance (Verified)

Actor must be ADMIN, or an active ISSUER/ADMIN member of an APPROVED and `is_issuer` organization, and the credential type must be within the org's authorized list (when the list is non-empty). The service builds a canonical `credentialSubject` (`id: urn:uuid:<subject>`, `name`, plus claims), issues a JWT VC via Veramo, hashes the JWT, stores the archive row plus `qr_payload`, and writes a `CREDENTIAL_ISSUED` audit event.

Note: if the issuing organization's DID is a synthetic `did:credlink:org:*` (the self-registration default), the VC is signed with the platform issuer DID from env, and trust lookup uses that platform DID. Cross-domain issuance through synthetic-DID orgs will typically fail domain accreditation. Only the environment-configured platform issuer (education-accredited) is fully consistent today.

### 6.3 Consent request and decision (Verified)

1. The requesting institution (org member or ADMIN) posts a consent request: citizen, optional credential, domain, purpose, requested claims, optional expiry.
2. The citizen receives it as PENDING, sees purpose and requested claims, then approves (optionally trimming the approved claim set) or denies.
3. On approval the consent becomes APPROVED with `granted_at`, `approved_claims`, and optional expiry; the citizen may later revoke it.
4. Listing auto-expires APPROVED consents whose `expires_at` has passed.

### 6.4 Claim-limited sharing (Verified)

`POST /api/consents/share-access` requires an active APPROVED, unexpired consent for that (citizen, requesting org, credential/domain), then returns only the approved claims. If no approved claim key matches the stored claim keys, it falls back to returning the full claim set - a detail worth surfacing honestly rather than implying strict minimization in that edge case.

### 6.5 Verification (Verified)

- **Mode A (basic):** signature + trust + lifecycle. No consent required. Used to check a presented credential.
- **Mode B (consent-bound):** adds the consent gate and claim intersection, then consumes the consent. Used when a verifier acts on a citizen's authorization.

### 6.6 Revocation and withdrawal (Verified)

- Issuer revokes a credential with a reason; verification then rejects it and the reason is retrievable from audit metadata.
- Citizen revokes a consent; subsequent `share-access` for that credential/org is forbidden.

### 6.7 Audit (Verified)

Every write path inserts an `audit_logs` row with actor, organization, event type, action text, domain, outcome, target id, and metadata. Read scoping: ADMIN sees all; organization members see their org plus their own actor events; unaffiliated users see only their own actor events. The `search` query parameter is accepted but ignored by the service.
---

## 7. Limitations, security considerations, and honest-mock boundaries

### 7.1 What the UI must never claim

- No wallet, no citizen-held keys, no self-sovereign identity, no offline credential possession.
- No zero-knowledge proofs, no "tamper-proof", no "100% secure", no "instant".
- No MFA, email verification, or password reset. Registering does not verify an email address.
- No QR presentation or scanning, even though `qr_payload` exists.
- No immutability claim for the audit log.
- No multi-organization switching beyond the first active membership.
- No notifications, no email, no webhooks.

### 7.2 Real limitations to design around

1. **Synthetic DIDs and the platform issuer.** Self-registered orgs get `did:credlink:org:<code>`, which Veramo does not manage; issuance falls back to the env platform DID. The trust registry is keyed by DID, so verification consistency depends on that platform entry (currently education-accredited).
2. **Domain accreditation is strict.** `accredited_for` must exactly equal the credential domain. Missing metadata means rejection. Admin tooling must make this field first-class.
3. **`EXPIRED` credential filtering is unreliable.** Prefer computing expiry from `expiration_date`.
4. **Consent `CONSUMED` is a response label, not a stored status.** The row becomes `EXPIRED`.
5. **Registration downgrade.** Requesting ADMIN yields CITIZEN silently. The register UI must explain the assigned role (the earlier mock layer already modelled this as `roleDowngraded`).
6. **First-membership-only context.** Multi-org accounts are shown as a single context.
7. **`/api/demo/dashboard` is partially broken** (see 5.1). Prefer the typed authenticated endpoints, or clearly label any use of the demo endpoint.
8. **Claims shape is polymorphic.** `claims` is a JSONB object or array; the UI needs one normalizer.
9. **No member management.** Memberships cannot be created or changed through the API, so no "manage team" screen.
10. **No admin user management** and no way to create an ADMIN through the API.
11. **Key persistence.** Veramo uses in-memory key/DID stores; without env-supplied keys, restarting loses the issuer identity.

### 7.3 Findings register (documentation vs. code)

| ID | Finding | Severity for frontend |
|---|---|---|
| F-01 | `requireRole` defined but never mounted; authorization is service/RLS only | Medium - UI must not assume a route-level guard |
| F-02 | `/api/demo/dashboard` references `consent_requests` and non-existent audit columns | High - do not build on this contract |
| F-03 | No FRONTEND_RECONNAISSANCE.md / HANDOFF doc survives, though deleted code referenced them | High - this document fills that gap |
| F-04 | No OpenAPI/spec; contracts exist only in code | Medium - types must be hand-mirrored |
| F-05 | `audit search` parameter ignored | Low |
| F-06 | Consent `CONSUMED` vs `EXPIRED` mismatch | Medium - copy must not invent a status |
| F-07 | Registration silently downgrades ADMIN to CITIZEN | Medium - must be explained in UI |
| F-08 | `EXPIRED` credential status rarely persisted | Low - compute expiry in the UI |
| F-09 | README says W3C VCs are "planned" but JWT VCs are implemented (narrow scope) | Low - describe the real narrow scope |
| F-10 | No tests runner/CI config; tests are standalone `tsx` scripts | Low - not a frontend blocker |
| F-11 | `share-access` falls back to full claims when no approved key matches | Medium - do not overstate minimization |
| F-12 | Multi-membership login returns only the first active membership | Medium |

---

## 8. Frontend information architecture

### 8.1 Architectural principles

1. **Two shells, one system.** A marketing shell (public) and a portal shell (authenticated/demo). Same tokens, different density.
2. **Role-aware navigation, not role-forked apps.** One portal with navigation filtered by account role and capability. Shared screens adapt labels (for example "My records" for citizens vs "Credentials" for institutions).
3. **Honest demo mode.** Until the API is connected, a clearly labelled demo/preview context selector replaces real sessions. No token is minted, no credential is faked as real, and every mocked interaction is labelled.
4. **Data adapter boundary.** Screens depend on a typed `DataClient` interface. A mock implementation and a future HTTP implementation are interchangeable.
5. **Evidence-bounded scope.** Only screens backed by a real endpoint or a real empty-state are included. Proposed additions are marked **[Proposed]**.

### 8.2 Global structure

```
/                     Marketing shell
  /how-it-works       [Proposed] deep narrative (design spec section 9)
  /trust              [Proposed] trust & security explainer
  /login              Auth (also /register)
  /demo               [Proposed] labelled demo context entry (role picker)

/portal               Portal shell (requires demo context or live session)
  /portal             Overview
  /portal/credentials        list
  /portal/credentials/new    issue        [institution/issuer only]
  /portal/credentials/[id]   detail
  /portal/requests           consent / verification requests list
  /portal/requests/[id]      request detail (approve/deny, track)
  /portal/verify             verification center (run a verification)
  /portal/verify/new         [Proposed] focused verification entry
  /portal/sharing            [Proposed] citizen's active sharing (approved consents)
  /portal/issuers            issuer directory (public trust info)
  /portal/issuers/[id]       [Proposed] issuer detail
  /portal/trust-registry     ADMIN trust registry
  /portal/organizations      ADMIN org approvals (also self-onboarding entry)
  /portal/organizations/[id] ADMIN org detail / status change
  /portal/onboard            [Proposed] institution self-registration
  /portal/audit              audit trail (role-scoped)
  /portal/profile            profile
```

Legend: screens without **[Proposed]** are directly supported by at least one verified endpoint.

---

### 8.3 Public screens

#### P1 - Landing page (`/`)
- **Purpose:** Explain the repeated-proof problem and the CredLink shift; route visitors to demo or institution access.
- **Target role:** Anonymous.
- **Main information:** Hero, friction narrative, three-step shift (issue, request, authorize/verify), citizen credential preview, institution workflow preview, four domains, trust explainer, closing CTA.
- **Primary actions:** See how it works; Explore the demo; Institution access.
- **Data requirements:** Static editorial content; a small, clearly labelled synthetic credential/request preview.
- **Backend endpoints:** None.
- **States:** Static; motion respects reduced motion.

#### P2 - How it works (`/how-it-works`) **[Proposed]**
- **Purpose:** Long-form narrative for the three-step model and claim-level sharing.
- **Target role:** Anonymous.
- **Main information:** Issue -> consent -> verify sequence with annotated UI previews; what is and is not stored.
- **Primary actions:** Explore the demo; read the trust explainer.
- **Data requirements:** Static.
- **Backend endpoints:** None.
- **States:** Static.

#### P3 - Trust and security (`/trust`) **[Proposed]**
- **Purpose:** Plain-language explanation of provenance, trust registry, revocation, consent, and audit - without security theatre.
- **Target role:** Anonymous.
- **Main information:** Who issued what; what is requested/authorized; how validity and revocation are represented; what the audit record captures; explicit list of what is not implemented.
- **Primary actions:** Explore the demo; read the trust registry preview.
- **Data requirements:** Static copy; optionally a labelled sample of a public trust entry.
- **Backend endpoints:** Read-only sample can be static; live data would use `GET /api/trust-registry` (authenticated, so not on the public page).
- **States:** Static.

#### P4 - Demo context entry (`/demo`) **[Proposed]**
- **Purpose:** Let a reviewer choose which synthetic role to browse as, without pretending it is authentication.
- **Target role:** Anonymous / reviewer.
- **Main information:** Demo accounts (see 9.5), each labelled with role, organization, and what it demonstrates; a persistent "Demo preview - no live authentication" banner.
- **Primary actions:** Enter as citizen / issuer / verifier / admin; read limitations.
- **Data requirements:** Demo account list from the mock layer only.
- **Backend endpoints:** None (mock only).
- **States:** Empty (no demo layer), default.

---

### 8.4 Authentication screens

#### A1 - Sign in (`/login`)
- **Purpose:** Authenticate (live) or enter a demo context (mock).
- **Target role:** All.
- **Main information:** Email, password, demo-account shortcut, suspended-account explanation, network error explanation.
- **Primary actions:** Sign in; go to register; enter demo.
- **Data requirements:** `POST /api/auth/login` -> `{ user, session, memberships }`. Mock signs in by demo account.
- **Backend endpoints:** `POST /api/auth/login`, `GET /api/auth/me`.
- **States:** Default; field validation; invalid credentials (401); suspended (403); network offline (503); loading; success redirect by role.

#### A2 - Register (`/register`)
- **Purpose:** Create an account and, for institutions, begin onboarding.
- **Target role:** All.
- **Main information:** Full name, email, password, phone, intended role. Must explain that ADMIN is not self-assignable and that the assigned role may be CITIZEN.
- **Primary actions:** Create account; sign in instead.
- **Data requirements:** `POST /api/auth/register` -> `{ user, session }` plus the assigned role. Mock surfaces `requestedRole`, `assignedRole`, `roleDowngraded`.
- **Backend endpoints:** `POST /api/auth/register`.
- **States:** Validation; duplicate email (400); password too short (400); assigned-role notice; loading; success.

#### A3 - Session expired / suspended (inline states, not a route)
- **Purpose:** Explain 401/403 outcomes without dead ends.
- **Target role:** All.
- **Main information:** What happened and what to do next.
- **Primary actions:** Sign in again; contact administrator (suspended).
- **Backend endpoints:** N/A (derived from generic error handling).
- **States:** Session expired (401), suspended (403), offline (503).

Note: password reset and email verification are **not supported**. Do not build a forgot-password screen that cannot work; if shown at all, present an honest "not available in this build" state.
---

### 8.5 Citizen portal

Citizen navigation: Overview, My records, Sharing requests, Active sharing, Issuers, Activity, Profile.

#### C1 - Citizen overview (`/portal`)
- **Purpose:** Show what needs attention and what is held.
- **Main information:** Counts of records by status, pending sharing requests, active shares expiring soon, recent activity.
- **Primary actions:** Review a pending request; open a record; view activity.
- **Data requirements:** credentials (subject scope), consents (citizen scope), audit logs (actor scope).
- **Endpoints:** `GET /api/credentials`, `GET /api/consents`, `GET /api/audit-logs`.
- **States:** Loading; empty (no records / no requests); error + retry; partial failure per section.

#### C2 - My records (`/portal/credentials`)
- **Purpose:** Browse and filter the citizen's credentials.
- **Main information:** Title, issuer, domain, issuance date, expiry, status (VALID/REVOKED/EXPIRED).
- **Primary actions:** Search; filter by domain/status; open detail.
- **Data requirements:** credential list, subject-scoped; pagination.
- **Endpoints:** `GET /api/credentials?subjectId=<self>&...`.
- **States:** Loading skeleton; empty; error/retry; no-results-for-filter; expired/revoked clearly labelled.

#### C3 - Credential detail (`/portal/credentials/[id]`)
- **Purpose:** Inspect a single credential and its claims.
- **Main information:** Title, type, issuer identity + DID, domain, status, issuance/expiry, claim list, provenance, QR payload (as a non-functional technical detail only), signature presence.
- **Primary actions:** Copy credential id / DID; view the issuer; view related consent requests. No issue/revoke actions for a citizen.
- **Data requirements:** single credential; optionally the subject's consents for that credential.
- **Endpoints:** `GET /api/credentials/:id`, `GET /api/consents`.
- **States:** Loading; not found (404); forbidden (403); revoked/expired treatment.

#### C4 - Sharing requests (`/portal/requests`)
- **Purpose:** The citizen's inbox of verification/consent requests.
- **Main information:** Requesting organization, purpose, domain, requested claims, status, expiry, received date.
- **Primary actions:** Filter by status/domain; open request; approve/deny from the row or detail.
- **Data requirements:** consent list, citizen-scoped (`citizenId=self`), pagination.
- **Endpoints:** `GET /api/consents?citizenId=<self>`.
- **States:** Loading; empty (no requests yet); error/retry; tabs by status (Pending, Approved, Denied, Expired).

#### C5 - Sharing request detail (`/portal/requests/[id]`)
- **Purpose:** Decide on a request with full context.
- **Main information:** Who is asking, why, which claims, the credential in question and its status, requested vs. approved claims, expiry.
- **Primary actions:** Approve (optionally deselect claims), Deny, later Revoke; view the credential.
- **Data requirements:** consent detail; linked credential (title/type/status) if present.
- **Endpoints:** `GET /api/consents/:id`, `POST /api/consents/:id/respond`, `POST /api/consents/:id/revoke`.
- **States:** Loading; not found; forbidden; already resolved (400, "already approved/denied"); expired; success with a clear "what happens next"; explicit confirmation before deny.

#### C6 - Active sharing (`/portal/sharing`) **[Proposed]**
- **Purpose:** A consolidated view of approvals still usable, with expiry, distinct from the request inbox.
- **Main information:** Organization, purpose, approved claims, granted date, expiry, consumption state.
- **Primary actions:** Revoke; open the source request; open the credential.
- **Data requirements:** consents filtered to APPROVED (and recently consumed) for the citizen.
- **Endpoints:** `GET /api/consents?status=APPROVED&citizenId=<self>`, `POST /api/consents/:id/revoke`.
- **States:** Loading; empty (nothing shared); error/retry; expiring-soon emphasis.

#### C7 - Issuer directory (`/portal/issuers`)
- **Purpose:** See which institutions can attest which records.
- **Main information:** Organization name, code, domain, verification status, issuer status, authorized credential types, trust status.
- **Primary actions:** Search; filter by domain; open issuer detail.
- **Data requirements:** organizations list + trust registry (join by organization).
- **Endpoints:** `GET /api/organizations`, `GET /api/trust-registry`.
- **States:** Loading; empty; error/retry; distinguishes listed vs. authorized vs. suspended vs. revoked.

#### C8 - Activity (`/portal/audit`)
- **Purpose:** The citizen's own recorded events.
- **Main information:** Timestamp, event, action, domain, outcome, target.
- **Primary actions:** Filter by event type/domain; open detail (metadata disclosed progressively).
- **Data requirements:** audit list (actor-scoped), pagination.
- **Endpoints:** `GET /api/audit-logs` (service scopes to actor).
- **States:** Loading; empty; error/retry; metadata secondary.

#### C9 - Profile (`/portal/profile`)
- **Purpose:** View and update name and phone.
- **Main information:** Name, email (read-only), phone, role (read-only), account status (read-only), organization context (read-only).
- **Primary actions:** Save name/phone.
- **Data requirements:** profile record.
- **Endpoints:** `GET /api/profiles/me`, `PATCH /api/profiles/me`.
- **States:** Loading; read-only fields clearly marked; validation; success toast; 403.

---

### 8.6 Issuer portal

Shown to COLLEGE/HOSPITAL/BANK/EMPLOYER accounts whose organization is APPROVED and `is_issuer` with ISSUER/ADMIN membership. When the organization is PENDING/DENIED or not an issuer, issuance is replaced with an honest "not yet authorized" state.

#### I1 - Institution overview (`/portal`)
- **Purpose:** Operate the issuing organization.
- **Main information:** Organization identity + verification state, issuance metrics (issued, active, revoked, expiring), incoming consent requests, verification results, recent audit.
- **Primary actions:** Issue credential; review requests; run a verification.
- **Data requirements:** org-scoped credentials, consents where requestingOrg = own org, audit (org scope).
- **Endpoints:** `GET /api/credentials`, `GET /api/consents`, `GET /api/audit-logs`.
- **States:** Loading; blocked state when org not approved (explain why); empty; error/retry.

#### I2 - Credentials (`/portal/credentials`)
- **Purpose:** Manage issued credentials.
- **Main information:** Subject name, title, type, domain, issuance date, status, revocation reason when applicable.
- **Primary actions:** Search; filter; open detail; issue new.
- **Data requirements:** credentials scoped to own org (`issuerOrgId`); pagination.
- **Endpoints:** `GET /api/credentials?issuerOrgId=<orgId>`.
- **States:** Loading; empty; error/retry; filter no-results; permission-denied when org not an issuer.

#### I3 - Issue credential (`/portal/credentials/new`)
- **Purpose:** Issue a new credential to a citizen.
- **Main information:** Subject picker, credential type (constrained to authorized types), domain, title, claim builder, optional expiry, preview of the credential subject, and a plain-language note that claims become visible only within approved consent.
- **Primary actions:** Search/select citizen; add/edit claims; issue; cancel.
- **Data requirements:** citizen list (`GET /api/profiles/citizens`), own org authorized types (from auth context), claim key/value input.
- **Endpoints:** `POST /api/credentials`, `GET /api/profiles/citizens`.
- **States:** Validation (subject required, title >= 2, claims required); 403 when not authorized/type not allowed; loading; success with the new credential id and a link to detail; partial-failure recovery (preserve entered values).

#### I4 - Credential detail / revoke (`/portal/credentials/[id]`)
- **Purpose:** Inspect an issued credential and revoke when required.
- **Main information:** Full claim list, subject, issuer, status, signature presence, QR payload (technical), audit of issuance/revocation.
- **Primary actions:** Revoke (with mandatory reason, explicit confirmation); copy ids.
- **Data requirements:** credential detail; revocation reason when revoked.
- **Endpoints:** `GET /api/credentials/:id`, `POST /api/credentials/:id/revoke`.
- **States:** Loading; not found; forbidden; already revoked (400); success + consequence explanation; destructive confirmation.

#### I5 - Verification requests (`/portal/requests`)
- **Purpose:** Requests this organization has made, and requests it received (if it is also a subject-adjacent verifier).
- **Main information:** Citizen, purpose, requested claims, status, expiry, originating member.
- **Primary actions:** New request; open request; filter by status.
- **Data requirements:** consents where requestingOrg = own org.
- **Endpoints:** `GET /api/consents?requestingOrgId=<orgId>`.
- **States:** Loading; empty; error/retry; status tabs.

#### I6 - Verification request detail (`/portal/requests/[id]`)
- **Purpose:** Track a request through the consent lifecycle and verify once approved.
- **Main information:** Citizen, purpose, requested vs. approved claims, status timeline (requested -> approved/denied -> consumed/expired), linked credential.
- **Primary actions:** Verify when approved (Mode B); cancel/close (no cancel endpoint exists - use revoke where the citizen owns it, otherwise present read-only); open credential.
- **Data requirements:** consent detail; linked credential.
- **Endpoints:** `GET /api/consents/:id`, `POST /api/verification/verify-credential` (with `consentId`, `verifierOrgId`).
- **States:** Awaiting consent (PENDING); approved; denied; expired; consumed; verification result; permission denied.

#### I7 - Verify credential (`/portal/verify`)
- **Purpose:** Run a verification of a credential, with or without consent, and present all checks.
- **Main information:** Input (credential id or payload), then the four checks (cryptographic, trust registry, lifecycle, consent) and any released claims.
- **Primary actions:** Run verification; optionally bind a consent; view the credential or issuer.
- **Data requirements:** verification response; optionally consent selection and verifier org.
- **Endpoints:** `POST /api/verification/verify-credential`, `POST /api/credentials/verify`.
- **States:** Idle; running; VALID/approved with detailed checks; rejected with a specific reason (signature invalid, issuer not trusted, not accredited for domain, revoked, expired, consent missing/consumed); input validation; network error.

#### I8 - Issuer directory (`/portal/issuers`) and I9 - Activity (`/portal/audit`)
- Reuses C7 and C8 with organization scope for audit.

#### I10 - Organization profile (`/portal/profile` or `/portal/organization`)
- **Purpose:** Show the institution's identity, verification status, authorized credential types, and trust status.
- **Main information:** Name, code, domain, DID (progressive disclosure), verification status, issuer status, authorized types, trust status + accreditation, last verified.
- **Primary actions:** Read-only for institution users; link to trust entry.
- **Endpoints:** `GET /api/organizations/:id`, `GET /api/trust-registry/:orgId`.
- **States:** Loading; pending/deneid explanation; error.

#### I11 - Institution onboarding (`/portal/onboard`) **[Proposed]**
- **Purpose:** Let a new institutional account submit its organization registration.
- **Main information:** Name, code, domain, registration reference; explanation of the PENDING approval and issuer authorization steps.
- **Primary actions:** Submit registration; view status.
- **Endpoints:** `POST /api/organizations`.
- **States:** Validation; duplicate code (400); submitting; success (PENDING); already registered.

---

### 8.7 Verifier portal

Any institution can verify; banks and hospitals are the clearest verifier personas. These screens are capability-gated, not role-forked.

#### V1 - Verification center (`/portal/verify`)
- As I7. This is the verifier's primary screen. It must separate "approved" (consent granted) from "verified" (checks passed).

#### V2 - New verification request (`/portal/requests/new`) **[Proposed]**
- **Purpose:** Ask a citizen to authorize specific claims.
- **Main information:** Citizen picker, credential (optional, constrained to that citizen's records the org can see), domain, purpose (free text, min 3), requested claims (multi-select from the credential's claim keys), optional expiry.
- **Primary actions:** Select citizen; load their credentials; choose claims; send request.
- **Endpoints:** `GET /api/profiles/citizens`, `GET /api/credentials?subjectId=<citizen>`, `POST /api/consents/request`.
- **States:** Validation (purpose, citizen, claims); no credentials found for the citizen; 403 when not an active member; loading; success (PENDING) + link to the request.

#### V3 - Request detail (`/portal/requests/[id]`)
- As I6, framed as a decision tracker with the consent timeline and the verify action.

#### V4 - Verify and consume consent (`/portal/verify?consentId=...`)
- Mode B verification. Explain that a successful verification consumes the consent.
- **States:** approved consent available; consent already consumed; consent expired; consent belongs to another verifier; rejected checks.

#### V5 - Shared credential access (`/portal/requests/[id]` result panel or `/portal/verify`)
- **Purpose:** Show the selectively disclosed claims.
- **Main information:** Shared claims only, plus consent id, purpose, accessed time.
- **Endpoints:** `POST /api/consents/share-access`.
- **States:** Granted; forbidden (no active consent); expired/domain mismatch; empty shared-claims (edge case fallback).

#### V6 - Verification history (`/portal/audit?eventType=VERIFICATION_APPROVED`)
- Reuses the audit screen filtered to verification events.

#### V7 - Issuer lookup (`/portal/issuers/[id]`) **[Proposed]**
- **Purpose:** Confirm an issuer's trust status and accreditation before relying on a credential.
- **Main information:** Identity, domain, trust status, accreditation domain, last verified, active credential types.
- **Endpoints:** `GET /api/trust-registry/:orgId`, `GET /api/organizations/:id`.
- **States:** Loading; not registered (UNREGISTERED treatment); suspended/revoked; error.

---

### 8.8 Administrator portal

#### X1 - Network overview (`/portal`)
- **Purpose:** Network-level governance at a glance.
- **Main information:** Total credentials / valid / revoked, organizations by status, trusted issuers, pending consents, recent audit.
- **Actions:** Jump to pending org approvals, trust registry, audit.
- **Endpoints:** `GET /api/credentials`, `GET /api/organizations`, `GET /api/trust-registry`, `GET /api/consents`, `GET /api/audit-logs`.
- **States:** Loading; empty; partial failure per section; error/retry.

#### X2 - Organizations (`/portal/organizations`)
- **Purpose:** Review and govern registered institutions.
- **Main information:** Name, code, domain, verification status, issuer flag, authorized types, created date.
- **Actions:** Filter by domain/status/search; open detail; approve/deny/quarantine from detail.
- **Endpoints:** `GET /api/organizations`.
- **States:** Loading; empty; error/retry; filter no-results.

#### X3 - Organization detail / status change (`/portal/organizations/[id]`)
- **Purpose:** Approve or deny an organization and grant issuer authorization.
- **Main information:** Full org identity, DID, current verification/issuer status, authorized credential types, trust entry, audit history.
- **Actions:** Set PENDING/APPROVED/DENIED; toggle `isIssuer`; edit `authorizedCredentialTypes`; then register/refresh the trust entry.
- **Endpoints:** `PATCH /api/organizations/:id/status`, `GET /api/trust-registry/:orgId`, `POST /api/trust-registry/register`.
- **States:** Loading; not found; validation; explicit confirmation for DENIED; success; warning if registering trust without `accredited_for`.

#### X4 - Trust registry (`/portal/trust-registry`)
- **Purpose:** Manage network trust.
- **Main information:** Organization, issuer DID, trust status, accreditation domain (`accredited_for`), last verified, registered/updated.
- **Actions:** Filter by status/domain; open entry; change status (VERIFIED/SUSPENDED/REVOKED) with reason.
- **Endpoints:** `GET /api/trust-registry`, `PATCH /api/trust-registry/:id/status`, `POST /api/trust-registry/register`.
- **States:** Loading; empty; error/retry; status-change confirmation; missing-accreditation warning (this is the most common cause of rejected verification).

#### X5 - Trust entry detail (`/portal/trust-registry/[id]`) **[Proposed]**
- **Purpose:** Deep view for a single issuer's trust record.
- **Main information:** Identity, DID, status timeline, accreditation metadata, related credentials and verification outcomes.
- **Endpoints:** `GET /api/trust-registry/:orgId`, `GET /api/credentials?issuerOrgId=`.
- **States:** Loading; not found; suspended/revoked; error.

#### X6 - All credentials (`/portal/credentials`)
- **Purpose:** Cross-network credential oversight.
- **Main information:** Subject, issuer, title, type, domain, status, dates.
- **Actions:** Filter/search; open detail; revoke if warranted.
- **Endpoints:** `GET /api/credentials`, `GET /api/credentials/:id`, `POST /api/credentials/:id/revoke`.
- **States:** As C2/I2, unscoped.

#### X7 - All requests (`/portal/requests`)
- **Purpose:** Cross-network consent oversight.
- **Main information:** Citizen, requesting org, purpose, domain, claims, status.
- **Endpoints:** `GET /api/consents`.
- **States:** As C4.

#### X8 - Audit trail (`/portal/audit`)
- **Purpose:** Full network audit.
- **Main information:** Timestamp, event, actor, organization, target, outcome, metadata.
- **Actions:** Filter by domain/event type; progressive metadata; no search reliance (server ignores `search`; filter client-side or omit).
- **Endpoints:** `GET /api/audit-logs`.
- **States:** Loading; empty; error/retry; detail drawer.

#### X9 - Citizens directory (`/portal/citizens`) **[Proposed]**
- **Purpose:** Read-only oversight of active citizens and their credential counts.
- **Main information:** Name, email, status, created date, credential count where derivable.
- **Endpoints:** `GET /api/profiles/citizens`.
- **States:** Loading; empty; error/retry; read-only, with a privacy note.

Explicitly out of scope (no backend support): member management, admin user creation, role editing, account suspension UI, password reset.

---

### 8.9 Shared components and navigation

- **Shell primitives:** portal shell (sidebar/drawer/bottom-nav), topbar with current organization + role + context switcher (demo), marketing shell (header/footer).
- **Navigation:** role-filtered nav groups (Workspace, Network, Account); active-route handling; mobile drawer + bottom bar for <=5 primary items; skip link.
- **UI primitives:** Button (primary/secondary/tertiary/destructive), Input, Select, Multi-select/claim picker, Textarea, Badge/status (text + icon + color), Card/Panel, Table (responsive strategy), Tabs, Dialog/Sheet, Toast/live region, Tooltip, CopyableId, Breadcrumb, EmptyState, ErrorState/Retry, Skeleton, Pagination, PageHeader, DescriptionList, Timeline, ProgressiveDisclosure for technical IDs.
- **Domain-aware components:** StatusBadge (unified status vocabulary), DomainTag, ClaimList, ClaimDiff (requested vs. approved), TrustStatusCell, VerificationCheckList, ConsentTimeline, AuditEventRow, IssuerIdentity.
- **Guards:** `RequireAuth`, `RequireRole(capability)`, `RequireOrganizationApproved`, all rendering honest permission-denied states rather than redirects into dead ends.
---

## 9. Mock-data contract

### 9.1 Principles

1. Mock data is synthetic, internally consistent, and never a real person's data.
2. Mock data lives in `lib/mock-data/`; mock behaviour lives in `lib/mock-services/`. Components never import fixtures directly; they import a `DataClient`.
3. The `DataClient` interface mirrors the real endpoints one-to-one (path, body, response envelope) so a live HTTP client can replace it without touching components.
4. Every mock method returns the real `ApiResponse<T>` envelope, including `success`, `error`, `details[]`, and `timestamp`, and applies the same role/scope rules as the backend.
5. Time is anchored to a fixed demo instant so relative states never flip between renders.
6. Simulated latency, and explicit failure switches (offline, forbidden, not-found) exist so loading/error states are exercised.
7. No unsupported behaviour: no wallet, no QR scanning, no notifications, no password reset.

Proposed file layout (inside `frontend-v2/`):

```
lib/
  types/
    domain.ts            # vocabularies + domain records (section 2 + 9.2)
    api.ts               # ApiResponse, Pagination, Paged
    verification.ts      # verification + shared-access shapes
    data-client.ts       # the DataClient interface + query/input types
  mock-data/
    index.ts
    organizations.ts
    profiles.ts
    credentials.ts
    consents.ts
    trust-registry.ts
    audit-logs.ts
    demo-accounts.ts
    clock.ts             # DEMO_NOW
  mock-services/
    index.ts             # createMockDataClient(actor)
    store.ts             # in-memory mutable store seeded from mock-data
    auth.mock.ts
    profile.mock.ts
    organization.mock.ts
    credential.mock.ts
    consent.mock.ts
    trust.mock.ts
    verification.mock.ts
    audit.mock.ts
    health.mock.ts
  api/
    http-client.ts       # future live implementation of the same interface
```

### 9.2 Core TypeScript interfaces (mirror the API camelCase shapes)

```ts
// --- vocabularies (do not widen) ---
export type AccountRole = 'CITIZEN' | 'COLLEGE' | 'BANK' | 'HOSPITAL' | 'EMPLOYER' | 'ADMIN';
export type AccountStatus = 'ACTIVE' | 'SUSPENDED';
export type MemberRole = 'ADMIN' | 'ISSUER' | 'VERIFIER' | 'MEMBER';
export type OrgDomain = 'college' | 'employer' | 'bank' | 'hospital' | 'network_admin';
export type OrgVerificationStatus = 'PENDING' | 'APPROVED' | 'DENIED';
export type CredentialDomain = 'education' | 'employment' | 'finance' | 'healthcare';
export type ConsentDomain = CredentialDomain | 'all';
export type CredentialStatus = 'VALID' | 'REVOKED' | 'EXPIRED';
export type ConsentStatus = 'PENDING' | 'APPROVED' | 'DENIED' | 'REVOKED' | 'EXPIRED';
export type TrustStatus = 'VERIFIED' | 'SUSPENDED' | 'REVOKED';
export type VerificationResult = 'APPROVED' | 'REJECTED';
export type AuditEventType =
  | 'CREDENTIAL_ISSUED' | 'CREDENTIAL_REVOKED'
  | 'VERIFICATION_REQUESTED' | 'VERIFICATION_APPROVED'
  | 'ORGANIZATION_STATUS_CHANGED' | 'CONSENT_GRANTED' | 'CONSENT_REVOKED';
export type AuditOutcome = 'SUCCESS' | 'FAILURE' | 'PENDING';

// --- transport ---
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  details?: { field: string; message: string }[];
  timestamp: string;
}
export interface Pagination { page: number; limit: number; total: number; totalPages: number; }
export interface Paged<T> { items: T[]; pagination: Pagination; }

// --- identity ---
export interface AuthSession { access_token: string; refresh_token: string; expires_at?: number; }
export interface AuthUser {
  id: string; email: string; fullName: string; phone?: string | null;
  role: AccountRole; status: AccountStatus;
  organizationId: string | null; organizationName: string;
  organizationCode: string | null; organizationDomain: OrgDomain | null;
  organizationDid: string; organizationStatus: OrgVerificationStatus | null;
  isIssuer: boolean; authorizedCredentialTypes: string[]; createdAt?: string;
}
export interface ProfileRecord {
  id: string; fullName: string; email: string; phone: string | null;
  role: AccountRole; accountStatus: AccountStatus; createdAt: string; updatedAt: string;
}
export interface CitizenSummary {
  id: string; fullName: string; email: string;
  accountStatus: AccountStatus; credentialCount: number; createdAt: string;
}
export interface OrganizationSummary {
  id: string; name: string; code: string; domain: OrgDomain; did: string;
  verificationStatus: OrgVerificationStatus; isIssuer: boolean;
  authorizedCredentialTypes: string[]; registrationRef: string | null; createdAt: string;
}
export interface OrganizationMembership {
  id: string; memberRole: MemberRole; status: AccountStatus; organization: OrganizationSummary;
}
export interface LoginResponseData { user: AuthUser; session: AuthSession; memberships: OrganizationMembership[]; }
export interface MeResponseData { user: AuthUser; memberships: OrganizationMembership[]; }

// --- credentials ---
export interface CredentialIssuerRef { id: string; name: string; did: string; }
export interface CredentialRecord {
  id: string; subjectId: string; subjectName: string | null;
  issuerOrgId: string; issuer: CredentialIssuerRef | null;
  domain: CredentialDomain; credentialType: string; title: string;
  claims: Record<string, unknown> | unknown[];
  issuanceDate: string; expirationDate: string | null;
  status: CredentialStatus; revocationReason: string | null; revokedAt: string | null;
  issuerSignature?: string; qrPayload?: string;
  createdAt: string; updatedAt: string;
}

// --- consents ---
export interface ConsentRecord {
  id: string; citizenId: string; citizenName: string | null; citizenEmail: string | null;
  requestingOrgId: string; requestingOrg: { id: string; name: string; code: string } | null;
  credentialId: string | null;
  credential: { id: string; title: string; credentialType: string; status: CredentialStatus } | null;
  domain: ConsentDomain; purpose: string;
  requestedClaims: string[]; approvedClaims: string[];
  status: ConsentStatus;
  grantedAt: string | null; expiresAt: string | null;
  createdAt: string; updatedAt: string;
}

// --- trust registry ---
export interface TrustRegistryEntry {
  id: string; organizationId: string; issuerIdentifier: string;
  organization: OrganizationSummary | null;
  trustStatus: TrustStatus;
  verificationMetadata: { accredited_for?: CredentialDomain; accreditedFor?: CredentialDomain; [k: string]: unknown };
  lastVerifiedAt: string | null; createdAt: string; updatedAt: string;
}

// --- verification ---
export interface BasicVerificationCheck {
  valid: boolean;
  reason: string | null;
  applicationStatus: 'VALID' | 'INVALID' | 'NOT_FOUND' | 'REJECTED' | 'REVOKED' | 'EXPIRED';
  credentialId?: string; credentialIdUri?: string; issuerDid?: string; subjectId?: string;
  claims?: Record<string, unknown>;
  cryptographicVerification: { signatureValid: boolean; algorithm: string; verifiedAt?: string; error?: string };
  trustRegistryCheck?: { isTrusted: boolean; status: TrustStatus | 'UNREGISTERED'; accreditedFor?: string | null; requiredDomain?: CredentialDomain };
  lifecycleDetails?: { status: string; issuanceDate: string; expirationDate: string | null };
  revocationDetails?: { isRevoked: boolean; reason: string | null; revokedAt: string | null };
  expirationDetails?: { isExpired: boolean; expirationDate: string | null };
}
export interface ComprehensiveVerificationCheck {
  verified: boolean;
  verificationResult: VerificationResult;
  reason: string | null;
  mode?: 'BASIC_VERIFICATION' | 'BANK_VERIFICATION_REQUEST';
  credentialSummary?: { id: string; subjectId: string; domain: CredentialDomain; credentialType: string; title: string; status: CredentialStatus };
  allowedClaims?: Record<string, unknown>;
  consentDetails?: { consentId: string; status: 'CONSUMED'; consumedAt: string; purpose: string } | null;
  trustRegistryCheck?: {
    issuerDid: string; issuerName?: string; isTrusted: boolean;
    trustStatus: TrustStatus | 'UNREGISTERED'; accreditedFor?: CredentialDomain | null; requiredDomain?: CredentialDomain;
  };
  lifecycleCheck?: { status: string; isRevoked: boolean; isExpired: boolean; issuanceDate?: string; expirationDate?: string | null };
  cryptographicCheck?: { signatureValid: boolean; algorithm: string; verifiedAt?: string };
}
export interface SharedAccessResult {
  sharedClaims: Record<string, unknown>;
  consentId: string; credentialId: string; requestingOrgId: string;
  requestedClaims: string[]; approvedClaims: string[];
  purpose: string; status: 'GRANTED'; grantedAt: string;
}

// --- audit ---
export interface AuditLogRecord {
  id: string; timestamp: string; eventType: AuditEventType; action: string;
  domain: string | null; outcome: AuditOutcome;
  actor: string; actorId: string | null;
  organization: string; organizationId: string | null;
  targetResourceId: string | null;
  metadata: Record<string, unknown>; details: string;
}

// --- health ---
export interface HealthCheckResponse {
  status: 'ok' | 'degraded';
  service: string; version: string; timestamp: string; uptime: number;
  database: { status: 'connected' | 'disconnected'; latencyMs?: number; error?: string };
}
```

### 9.3 Actor context and the DataClient boundary

```ts
export interface ActorContext {
  userId: string;
  role: AccountRole;
  accountStatus: AccountStatus;
  organizationId: string | null;
  memberRole: MemberRole | null;
}

export interface DataClient {
  readonly mode: 'mock' | 'live';
  signIn(input: { email: string; password: string; simulateOffline?: boolean }): Promise<ApiResponse<LoginResponseData & { mode: 'demo' }>>;
  register(input: { email: string; password: string; fullName: string; phone?: string; role: AccountRole }): Promise<ApiResponse<{ user: AuthUser; assignedRole: AccountRole; requestedRole: AccountRole; roleDowngraded: boolean; session: null; mode: 'demo' }>>;
  getMe(): Promise<ApiResponse<MeResponseData>>;
  signOut(): Promise<ApiResponse<null>>;

  listProfiles(): Promise<ApiResponse<ProfileRecord>>;
  updateProfile(input: { fullName?: string; phone?: string }): Promise<ApiResponse<ProfileRecord>>;
  listCitizens(): Promise<ApiResponse<CitizenSummary[]>>;

  listOrganizations(q?: { page?: number; limit?: number; domain?: OrgDomain; search?: string; verificationStatus?: OrgVerificationStatus }): Promise<ApiResponse<Paged<OrganizationSummary>>>;
  getOrganization(id: string): Promise<ApiResponse<OrganizationSummary>>;
  createOrganization(input: { name: string; code: string; domain: OrgDomain; registrationRef?: string }): Promise<ApiResponse<OrganizationSummary>>;
  updateOrganizationStatus(id: string, input: { verificationStatus: OrgVerificationStatus; isIssuer?: boolean; authorizedCredentialTypes?: string[] }): Promise<ApiResponse<OrganizationSummary>>;

  listCredentials(q?: { page?: number; limit?: number; domain?: CredentialDomain; status?: CredentialStatus; subjectId?: string; issuerOrgId?: string; search?: string }): Promise<ApiResponse<Paged<CredentialRecord>>>;
  getCredential(id: string): Promise<ApiResponse<CredentialRecord>>;
  issueCredential(input: { subjectId: string; issuerOrgId?: string; domain: CredentialDomain; credentialType: string; title: string; claims: Record<string, unknown>; expirationDate?: string | null }): Promise<ApiResponse<CredentialRecord>>;
  revokeCredential(id: string, reason: string): Promise<ApiResponse<CredentialRecord>>;

  listConsents(q?: { page?: number; limit?: number; status?: ConsentStatus; domain?: ConsentDomain; citizenId?: string; requestingOrgId?: string; search?: string }): Promise<ApiResponse<Paged<ConsentRecord>>>;
  getConsent(id: string): Promise<ApiResponse<ConsentRecord>>;
  requestConsent(input: { citizenId: string; requestingOrgId?: string; credentialId?: string | null; domain: ConsentDomain; purpose: string; requestedClaims: string[]; expiresAt?: string | null }): Promise<ApiResponse<ConsentRecord>>;
  grantConsent(input: { requestingOrgId: string; credentialId?: string | null; domain: ConsentDomain; purpose: string; approvedClaims: string[]; expiresAt?: string | null }): Promise<ApiResponse<ConsentRecord>>;
  respondConsent(id: string, input: { action: 'APPROVE' | 'DENY'; approvedClaims?: string[]; expiresAt?: string | null }): Promise<ApiResponse<ConsentRecord>>;
  revokeConsent(id: string): Promise<ApiResponse<ConsentRecord>>;
  accessSharedCredential(input: { credentialId: string; requestingOrgId?: string }): Promise<ApiResponse<SharedAccessResult>>;

  listTrustRegistry(q?: { page?: number; limit?: number; trustStatus?: TrustStatus; domain?: OrgDomain; search?: string }): Promise<ApiResponse<Paged<TrustRegistryEntry>>>;
  getTrustEntry(orgIdOrDid: string): Promise<ApiResponse<TrustRegistryEntry>>;
  registerTrustIssuer(input: { organizationId: string; trustStatus?: TrustStatus; verificationMetadata?: Record<string, unknown> }): Promise<ApiResponse<TrustRegistryEntry>>;
  updateTrustStatus(id: string, input: { trustStatus: TrustStatus; reason?: string; metadata?: Record<string, unknown> }): Promise<ApiResponse<TrustRegistryEntry>>;

  verifyBasic(input: { credentialId?: string; credentialPayload?: unknown }): Promise<ApiResponse<BasicVerificationCheck>>;
  verifyCredential(input: { credentialId?: string; credentialPayload?: unknown; consentId?: string; verifierOrgId?: string }): Promise<ApiResponse<ComprehensiveVerificationCheck>>;

  listAuditLogs(q?: { page?: number; limit?: number; domain?: string; eventType?: AuditEventType; search?: string }): Promise<ApiResponse<Paged<AuditLogRecord>>>;
  checkHealth(): Promise<ApiResponse<HealthCheckResponse>>;
}
```

Two factories make the replacement seam explicit:
`createMockDataClient(actor: ActorContext): DataClient` and, later, `createHttpDataClient(token: string): DataClient`.
`createDataClient()` selects mock vs. live from configuration. Application code depends only on `DataClient`.

### 9.4 Mock service behaviour and state transitions

Each mock service applies the backend's scoping and transitions against an in-memory store seeded from `mock-data/`.

- **auth.mock:** signIn matches a demo account, rejects suspended accounts, rejects unknown emails with a non-enumerating message. register validates, rejects duplicate emails, and downgrades a requested ADMIN to CITIZEN with `roleDowngraded: true`.
- **organization.mock:** list/get return seeded organizations; create forces PENDING/non-issuer and makes the actor the org ADMIN; status changes require `actor.role === 'ADMIN'`.
- **credential.mock:** issue requires ADMIN or an ISSUER/ADMIN member of an APPROVED issuer org and enforces `authorizedCredentialTypes`; sets status VALID and a synthetic signature; writes an audit event. revoke requires issuer-org ISSUER/ADMIN or ADMIN, rejects double revocation, and stores the reason.
- **consent.mock:** request requires an active member of the requesting org (or ADMIN) and a PENDING record; respond requires the citizen owner and a PENDING record, then APPROVED/DENIED; revoke requires owner/ADMIN and sets REVOKED; list auto-expires APPROVED rows past `expiresAt`; `accessSharedCredential` requires an APPROVED, unexpired, matching consent and returns only approved claims.
- **trust.mock:** reads are open to authenticated actors; register and status change require ADMIN; register requires the org to be APPROVED.
- **verification.mock:** implements the exact decision order of section 5.4, including the accreditation-domain check and the Mode B claim intersection plus consent consumption (`APPROVED` -> `EXPIRED`, response label `CONSUMED`).
- **audit.mock:** appends an event on every write and scopes reads exactly like the service (ADMIN all; org members org + self; others self). `search` filters client-side in the mock for usefulness, while a note records that the live server ignores it.
- **health.mock:** returns `ok` with a simulated latency, or `degraded` when `simulateOffline` is on.

### 9.5 Role-specific sample accounts

Synthetic demo accounts (no real people; passwords are demo-only and may be shown on `/demo`):

| Key | Role | Organization | Member role | Demonstrates |
|---|---|---|---|---|
| citizen | CITIZEN | none | - | Held credentials, incoming requests, consent decisions |
| college | COLLEGE | Oxford University (Synthetic), APPROVED issuer, education | ADMIN | Education issuance, verification requests |
| hospital | HOSPITAL | AIIMS (Synthetic), APPROVED issuer, healthcare | ADMIN | Healthcare issuance and verification |
| finance | BANK | Apex Global Bank (Synthetic), APPROVED, verifier | VERIFIER | Mode B verification as a verifier that does not issue |
| employer | EMPLOYER | TechCorp Solutions (Synthetic), APPROVED issuer, employment | ISSUER | Employment issuance and revocation |
| northbridge | BANK | Northbridge Credit Union (Synthetic), APPROVED issuer, finance | ISSUER | Finance issuance; a trust-suspended variant for rejection states |
| admin | ADMIN | CredLink Network Governance (network_admin) | - | Org approvals, trust registry, full audit |
| suspended | CITIZEN | none | - | Suspended-account sign-in rejection |

Optional extra citizens (Priya, Daniel, Mei Lin, Sofia) provide realistic received-request and shared-record variety without crowding the primary persona.

### 9.6 Representative dummy records

Provide a small, internally consistent set (numbers are illustrative, not a specification of the final fixtures):

- **Organizations (8):** approved issuers across all four domains, one pending, one denied, plus the governance pseudo-org.
- **Profiles (8-9):** the demo accounts plus 3-4 additional citizens.
- **Credentials (10-12):** at least one VALID per domain for the primary citizen; one EXPIRED; one REVOKED with a stored reason; a couple for other citizens.
- **Consents (10-14):** one PENDING per citizen persona, at least one APPROVED (unexpired), one APPROVED-but-expired, one DENIED, one REVOKED, one already-consumed (EXPIRED) so Mode B "already consumed" is demonstrable.
- **Trust entries (7-8):** VERIFIED for each accredited issuer with `accredited_for` matching its domain; one SUSPENDED; one REVOKED; one issuer intentionally missing accreditation to demonstrate the domain-mismatch rejection.
- **Audit logs (20-30):** spread across all seven event types, with a couple of FAILURE outcomes (for example a rejected verification because the issuer is suspended).

### 9.7 Required success and failure scenarios

| Scenario | How the mock produces it | Expected UI |
|---|---|---|
| Unauthenticated | No actor context | 401 state, redirect/return to sign-in |
| Forbidden by scope | Actor outside the organization/owner | 403 with an explanation, never a silent empty table |
| Not found | Unknown id | 404 that does not leak whether the record exists |
| Validation | Missing/short fields | Field-level errors from `details[]` |
| Conflict | Approve an already-resolved consent; revoke an already-revoked credential; consume a consumed consent | 400 business error with next step |
| Expiry | APPROVED consent past `expiresAt` | EXPIRED state, no verify action |
| Revocation | REVOKED credential | Rejected verification with the stored reason |
| Suspended issuer | Trust status SUSPENDED | Rejected verification, reason "issuer suspended" |
| Domain mismatch | Accreditation domain != credential domain | Rejected verification, reason "issuer not accredited for this domain" |
| Offline | `simulateOffline` / network toggle | 503 with retry |
| Empty | Filters matching nothing, or a fresh persona | Purposeful empty state with a next action |
| Slow | Simulated latency | Skeletons/spinners, no layout shift |

### 9.8 Separation rules (non-negotiable)

- `components/*` and `app/*` must not import from `lib/mock-data/` or `lib/mock-services/` except through `createDataClient`/`useDataClient`.
- A feature test must be able to swap in a live `DataClient` with no component change.
- Mock-only affordances (context switcher, simulated latency, `simulateOffline`) are injected via the client/provider, not hard-coded in screens.
- Everything mocked is labelled in the UI; nothing mocked is described as live.
---

## 10. API-to-screen mapping

| Endpoint | Client method | Primary screens |
|---|---|---|
| GET `/api/health` | `checkHealth` | Portal footer status, dev diagnostics |
| POST `/api/auth/register` | `register` | A2 Register |
| POST `/api/auth/login` | `signIn` | A1 Sign in, P4 Demo entry |
| POST `/api/auth/logout` | `signOut` | Topbar, C9/I10 Profile |
| GET `/api/auth/me` | `getMe` | Shell bootstrap, A1 session restore |
| GET `/api/profiles/me` | `listProfiles` | C9/I10 Profile |
| PATCH `/api/profiles/me` | `updateProfile` | C9/I10 Profile |
| GET `/api/profiles/citizens` | `listCitizens` | I3 Issue, V2 New request, X9 Citizens |
| GET `/api/organizations` | `listOrganizations` | C7/I8 Issuer directory, X2 Organizations |
| GET `/api/organizations/:id` | `getOrganization` | C7, I10, X3, V7 |
| POST `/api/organizations` | `createOrganization` | I11 Onboarding |
| PATCH `/api/organizations/:id/status` | `updateOrganizationStatus` | X3 Organization detail |
| GET `/api/credentials` | `listCredentials` | C1/C2, I1/I2, X1/X6 |
| POST `/api/credentials` | `issueCredential` | I3 Issue |
| GET `/api/credentials/:id` | `getCredential` | C3, I4, X6 |
| POST `/api/credentials/:id/revoke` | `revokeCredential` | I4, X6 |
| POST `/api/credentials/verify` | `verifyBasic` | I7 basic panel |
| GET `/api/consents` | `listConsents` | C1/C4/C6, I1/I5, X7 |
| POST `/api/consents/request` | `requestConsent` | V2 New request, I5 |
| POST `/api/consents` | `grantConsent` | C5 (direct grant variant) |
| GET `/api/consents/:id` | `getConsent` | C5, I6, V3 |
| POST `/api/consents/:id/respond` | `respondConsent` | C5 |
| POST `/api/consents/:id/revoke` | `revokeConsent` | C5/C6 |
| POST `/api/consents/share-access` | `accessSharedCredential` | V5 Shared access |
| GET `/api/trust-registry` | `listTrustRegistry` | C7, X4, trust explainer previews |
| POST `/api/trust-registry/register` | `registerTrustIssuer` | X3/X4 |
| GET `/api/trust-registry/:orgId` | `getTrustEntry` | I10, V7, X5 |
| PATCH `/api/trust-registry/:id/status` | `updateTrustStatus` | X4/X5 |
| POST `/api/verification/verify-credential` | `verifyCredential` | I7, V1/V4 |
| GET `/api/audit-logs` | `listAuditLogs` | C8, I9, V6, X1/X8 |
| GET `/api/demo/dashboard` | (do not build on) | Optional legacy demo banner only |

---

## 11. Unresolved questions

These must be answered before or during implementation; none block starting the reconnaissance-driven foundation.

1. **Portal model.** Should issuer and verifier be one institution portal with capability gating (recommended, matches the backend), or two separate portals? The backend has no "verifier" account role, so a separate portal would be presentational only.
2. **Multi-membership.** Given login returns only the first active membership, is single-context the intended product model, or should the frontend model a context switcher and treat this as a backend gap?
3. **Demo endpoint.** Is `/api/demo/dashboard` to be fixed or retired? If the demo must show live Supabase aggregates, it needs repair (F-02).
4. **Auth in the first build.** Confirm the first `frontend-v2` deliverable is mock-only (no Supabase Auth client), with the demo context switcher as the entry point.
5. **ADMIN provisioning.** There is no API to create an admin. Confirm admin is demo-only for now and not part of registration.
6. **Consent copy.** Confirm UI wording for the consumed state ("used once and closed" rather than a persisted CONSUMED status).
7. **Accreditation UX.** Should the admin trust-registry flow require `accredited_for` as a mandatory field? It is the single most common cause of rejected verification.
8. **QR payload.** Confirm it stays a read-only technical detail with no scan/verify affordance.
9. **Fonts and licensing.** Confirm `next/font/google` (DM Sans, Inter, IBM Plex Mono) is acceptable for the deployment, or choose a self-hosted fallback.
10. **Package manager and app placement.** The design spec assumes `frontend-v2/` as a standalone Next.js app. Confirm pnpm/npm and whether a workspace is desired.
11. **`EXPIRED` credential status.** Confirm the UI computes expiry from `expiration_date` rather than trusting `status === 'EXPIRED'`.
12. **Audit search.** Since the server ignores `search`, confirm the UI either filters client-side or omits search with a note.

---

## 12. Documentation gaps found

- No surviving `FRONTEND_RECONNAISSANCE.md` although deleted frontend code referenced it (sections 4 and 9.1). This document replaces it.
- No `FRONTEND_V2_HANDOFF.md`.
- No backend audit report or security report in the repository (the task-mention of "existing audit reports" has no file to read).
- No OpenAPI/Swagger or machine-readable contract; all contracts were reconstructed from controllers, services, and validators.
- `README.md` status table is partly stale (W3C/Veramo marked "in progress" though JWT VC issuance and verification are implemented; frontend integration marked "completed" though the v2 implementation was removed).
- `frontend_ins/lib/types.ts` cited a reconnaissance document that no longer exists; used here only as corroboration of API expectations, not as a source of truth.
- Backend tests are standalone `tsx` scripts with no runner configuration; they document demo accounts and expected lifecycle behaviour but are not an automated suite.

---

## 13. How these findings will guide the new frontend

1. Build against the **verified contracts** in sections 4-6, not the marketing text.
2. Make the **mock layer faithful to backend scoping and transitions** (section 9) so screens exercise real permission and lifecycle behaviour, not a happy path.
3. Treat **consent, issuance, verification, trust, and audit as distinct concepts** in the UI, with a single shared status vocabulary, per DESIGN.md section 3.
4. Represent **rejection as a first-class outcome** with specific reasons (signature, trust, accreditation, lifecycle, consent), never as a generic error.
5. Design **honest absent-feature states** for wallet, QR, password reset, member management, and admin provisioning instead of dead controls.
6. Keep **presentation and data separate** through `DataClient`, so the live HTTP client can replace the mock with no component rewrite.
7. Use the **design spec at `frontend-v2/docs/design/DESIGN.md`** as the visual source of truth and the inventory in section 8 as the build order.

---

## 14. Verification checklist for this reconnaissance

- [x] Backend routes, controllers, services, validators, middleware, config, and Veramo integration inspected.
- [x] Migrations and schema constraints inspected.
- [x] Demo accounts, role contexts, and lifecycle tests inspected.
- [x] Earlier frontend API expectations inspected (contracts only; design not reused).
- [x] Product truth separated from marketing claims.
- [x] Screen inventory produced per role with purpose, data, endpoints, and states.
- [x] Mock-data contract defined with types, services, transitions, accounts, and scenarios.
- [x] Backend and existing reports left unmodified.
- [x] No frontend implementation performed.
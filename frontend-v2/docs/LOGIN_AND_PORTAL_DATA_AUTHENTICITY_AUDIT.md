# CredLink — Login & Portal Data Authenticity Audit

**Date:** 2026-10-03
**Mode:** Strictly read-only. No source, config, env, schema, or dependency file was modified or created except this report.
**Question:** Are the login options real backend-authenticated accounts, or demo shortcuts that bypass authentication — and is the portal showing real or synthetic data?

Evidence labels: **Verified** (read from source in this pass), **Runtime** (observed against a running service in an earlier pass), **Inferred**, **UNVERIFIED**.

---

## 1. Executive summary and definitive answers

- **The login shortcuts are demo identities, not authenticated accounts.** The "Or open a preview context directly" options call a function that only sets React state plus a `localStorage` key. They never call `POST /api/auth/login`, never send credentials, and never touch the backend. **Verified.**
- **A real backend login is possible only through the email/password form** — but only for an email that is *not* one of the preview fixtures. The form intercepts any email that matches a preview account email and diverts it to demo mode **before** calling the backend (`frontend-v2/app/login/page.tsx:62-68`). **Verified.**
- **Portal data is mock when a preview context is active and live when a real session is active.** The client is chosen by `mode`, and `mode` is `demo` whenever a preview account is selected (`frontend-v2/lib/demo/demo-provider.tsx:188,212`). **Verified.**
- **Accessing `/portal/*` without credentials is intentional demo behavior, not an authentication bypass.** Demo mode is a first-class, explicitly labelled synthetic preview. The auth redirect only fires in live mode (`frontend-v2/components/portal/portal-shell.tsx:99-102`). **Verified.**
- **There is a real defect**, separate from the intended demo behavior: because preview fixture emails overlap real test-account emails (notably `admin@credlink.org` and `citizen@credlink.org`), **typing a real account's email on the login form silently opens the demo and never authenticates**. A user cannot sign in live with those addresses. **Verified.**
- **The live integration itself is working** and is not broken; it is being shadowed by the demo interception for colliding emails. **Verified (source) / Runtime (prior pass):** an admin email authenticated against the production backend in the earlier integration pass.

---

## 2. Login options and their execution paths

Source: `frontend-v2/app/login/page.tsx`. Preview list is rendered from `previewAccounts` (`page.tsx:188`), which is the fixture array `demoAccounts` re-exported in `frontend-v2/lib/data/index.ts:37`.

| Login option | Click behavior | Backend login called? | Credentials validated? | Session type | Data source |
|---|---|---|---|---|---|
| "Or open a preview context directly" button (one per fixture account) | `openContext(account)` → `enter(account)` → `router.push('/portal')` (`page.tsx:43-46, 188-190`) | **No** | **No** (any password; none supplied) | Demo selection; no token, no cookie | `createMockDataClient` over `lib/mock/fixtures.ts` |
| Email/password form, email **matches** a preview fixture | `previewAccounts.find(...)` → `enter(preview)` → redirect (`page.tsx:62-68`); `signIn` is never reached | **No** | **No** | Demo selection | Mock fixtures |
| Email/password form, email **does not match** a fixture | `signIn({email,password})` → `/api/auth/login` → backend Supabase login (`page.tsx:70`) | **Yes** | **Yes** (backend) | Live; HttpOnly cookie set by the route handler | Live backend via proxy |

Preview fixture identities (from `frontend-v2/lib/mock/fixtures.ts:175-262`): citizen, college, hospital, bank (`finance@`), employer, northbridge (suspended trust), admin, suspended. Headline text explicitly calls these "Synthetic". The login page also states: "These are not sessions … no credential is exchanged" (`page.tsx:184-186`) and the password hint says "Preview accounts accept any password."

`enter()` is defined at `frontend-v2/lib/demo/demo-provider.tsx:178-186`: it only calls `setSelectedKey(account.key)` and writes `localStorage['credlink.preview.context.v1']`. There is no `fetch` in that function. **Verified.**

---

## 3. Authentication provider and session behavior

- **Backend provider:** Supabase Auth. Registration uses `supabaseAdmin.auth.admin.createUser` (`backend/src/services/auth.service.ts:16`); login uses `supabaseClient.auth.signInWithPassword` (`auth.service.ts:84`); the auth middleware verifies the Bearer JWT with `supabaseAdmin.auth.getUser(token)` (`backend/src/middleware/authMiddleware.ts:41`). **Verified.**
- **App data:** a `profiles` table and an `organization_members` join selection (`auth.service.ts:96-113`). Memberships are read-only in application code. **Verified.**
- **V2 live session:** `POST /api/auth/login` stores the Supabase access token in the HttpOnly `cl_session` cookie and returns only `{ user, memberships }`; `GET /api/auth/me` bootstraps the session on load (`frontend-v2/app/api/auth/{login,me}/route.ts`). No token is exposed to the browser. **Verified.**
- **V2 demo session:** none. No token, no cookie, no backend call. **Verified.**

---

## 4. Demo/live mode selection logic

All in `frontend-v2/lib/demo/demo-provider.tsx`:

- `mode` is derived purely from whether a preview account is selected: `const mode = account ? 'demo' : 'live'` (**line 188**).
- The data client follows mode: `createDataClient(mode === 'demo' ? demoActor : null)` (**line 212**); `createDataClient` returns the mock client when a non-null actor is passed and the live client otherwise (`frontend-v2/lib/data/index.ts:24-26`).
- Live bootstrap (`fetch('/api/auth/me')`) runs independently and sets `liveStatus`/`liveUser` (**lines ~138-176**).

Consequences traced:

| Question | Answer | Evidence |
|---|---|---|
| Can a demo login enter live mode? | **No.** `createDataClient` receives `demoActor` (non-null) in demo mode → mock client. | `demo-provider.tsx:212`, `index.ts:24-26` |
| Can a real login continue showing mock data? | **Normally no** — `signIn` clears the demo selection (`setSelectedKey(null)` + remove `localStorage`). | `demo-provider.tsx:230-248` |
| Is there a stale-state risk? | **Yes, latent.** `mode` is `demo` whenever a preview key is present in `localStorage`, even if a valid live cookie also exists. The demo selection wins and the banner reports demo. A live session can be shadowed by a leftover preview selection until it is cleared. | `demo-provider.tsx:188`; `portal-shell.tsx:99` |
| Latent client-selection risk | If a preview seed had no matching profile, `demoActor` would be `null` and `createDataClient(null)` would return the **live** client while mode is `demo`. All eight current fixtures do match a profile, so this does not fire today. | `demo-provider.tsx:212`; `index.ts:24-26` |
| Does the banner identify the source? | **Yes, in demo mode only.** Live mode shows no banner. The wording "using backend test services and demo data" is imprecise — the portal is using local fixtures, not backend services. | `portal-shell.tsx:166-168` |
| Can `/portal/*` be reached without a live session? | **Yes, by design** — via a preview context. In live mode with no profile the shell renders a "Session required" screen and redirects. Child pages are not rendered in that branch, so no data leaks. | `portal-shell.tsx:99-102, 118-135` |

---

## 5. Portal data source matrix

In demo mode the provider's client is `createMockDataClient(demoActor)`, which reads `frontend-v2/lib/mock/fixtures.ts`. In live mode the client is `createLiveDataClient()`, which calls same-origin `/api/proxy/*` → backend. No portal page calls an API directly; all reads go through `useDataClient()`.

| Portal section | Demo mode source | Live mode source |
|---|---|---|
| Dashboard | Fixtures (in-memory composition) | Composed from `GET /api/proxy/{credentials,consents,organizations,audit-logs,profiles/citizens}` |
| Credentials (list/detail) | Fixtures | `GET /api/proxy/credentials[/:id]` |
| Credential issuance | Fixture mutation (local only) | `POST /api/proxy/credentials` |
| Credential revocation | Fixture mutation | `POST /api/proxy/credentials/:id/revoke` |
| Consents | Fixtures | `GET/POST /api/proxy/consents*` |
| Trust registry | Fixtures | `GET /api/proxy/trust-registry[/:orgId]` |
| Organizations | Fixtures | `GET /api/proxy/organizations` |
| Audit logs | Fixtures | `GET /api/proxy/audit-logs` |
| Profile | Fixture profile (`profileById`) | `GET /api/proxy/profiles/me` |
| Issuer/citizen directory | Fixtures | `GET /api/proxy/profiles/citizens` |

Because the demo client is used in demo mode, **all portal data displayed after a preview login is synthetic fixture data**, regardless of whether the backend is reachable. The data source is determined solely by the login option used.

---

## 6. Backend/Supabase authentication explanation

```
Preview login (fixture button or colliding email)
   └─ enter(account) → React state + localStorage   (NO network)
        └─ mode = 'demo' → createMockDataClient → lib/mock/fixtures.ts

Real login (non-colliding email + password)
   └─ POST /api/auth/login (Next route handler)
        └─ backend POST /api/auth/login
             └─ Supabase Auth signInWithPassword
                  └─ profiles + organization_members read back
                       └─ HttpOnly cl_session cookie → /api/auth/me → mode = 'live'
                            └─ createLiveDataClient → /api/proxy/* → backend
```

- Supabase **is** involved in real authentication (Verified in `auth.service.ts` / `authMiddleware.ts`); it is **not** involved in the preview path at all.
- Demo identities are hardcoded fixtures; they have no Supabase relationship. Their emails coincidentally match seeded backend test accounts, which is the source of the collision.
- Memberships shown in the portal in live mode come from the backend (`organization_members`); in demo mode they come from `organizationsById` fixtures.

---

## 7. Confirmed findings vs. unverified assumptions

**Confirmed (source-verified)**
- Preview buttons and the preview-the form branch bypass the backend entirely (`page.tsx:43-46, 62-68`; `demo-provider.tsx:178-186`).
- `mode` is derived from preview selection, and the data client is chosen from `mode` (`demo-provider.tsx:188, 212`; `index.ts:24-26`).
- Portal auth redirect applies only in live mode (`portal-shell.tsx:99-102`).
- Fixture emails collide with real seeded account emails (`fixtures.ts:178, 244`), and the form intercepts them before `signIn` (`page.tsx:62-68`).
- Backend authentication is Supabase-backed (`auth.service.ts:16,84`; `authMiddleware.ts:41`).
- Demo banner renders only in demo mode with imprecise wording (`portal-shell.tsx:166-168`).

**Runtime (earlier pass, production backend)**
- `admin@credlink.org` authenticated successfully through `/api/auth/login` with role `ADMIN`, confirming that at least one preview-account email also maps to a real backend account. No credential-based login was performed during this audit.

**Unverified**
- Whether every fixture email maps to an existing backend account (only admin was observed, in the earlier pass).
- Whether the local backend's seeded accounts use the same passwords referenced in project notes (not tested; no credential attempt made here).

**Inferred**
- The stale-localStorage shadowing risk (§4) is inferred from the mode derivation; it was not reproduced in a browser during this read-only pass.

---

## 8. Root cause of the observed behavior

1. **"Login options log me in immediately."** They are preview shortcuts. `openContext` → `enter` sets demo state and routes to `/portal`; no authentication occurs. This is **intended demo behavior**, clearly labelled on the page.
2. **"/portal/* stays accessible."** In demo mode `profile` is populated from fixtures, so `liveUnauthenticated` is false (`portal-shell.tsx:99`) and the portal renders. This is **intended** — demo mode is a synthetic walkthrough, not a session.
3. **"The portal shows dummy data."** Correct and expected in demo mode: the mock `DataClient` reads fixtures.
4. **"Isn't V2 integrated with the live backend?"** It is — for real (non-colliding) emails via `signIn` → `/api/auth/login` → Supabase, after which the live client and proxy are used.
5. **The actual defect:** the form's preview-email interception (`page.tsx:62-68`) combined with fixture/real email overlap means **real accounts whose email equals a fixture email can never authenticate through the form** — they are silently routed into demo mode with no error. This is a genuine bug, and it also makes it impossible for a user to tell whether they are in a real session.

---

## 9. Recommended minimal corrective actions

Not implemented (read-only audit). Smallest safe changes, in order:

1. **Remove the email-based preview interception** from `onSubmit` in `frontend-v2/app/login/page.tsx` (delete the `previewAccounts.find(...)` → `enter(preview)` branch, lines ~62-68) so the form always calls `signIn`. Keep the explicit preview buttons for demo mode. This alone makes real accounts (including colliding emails) authenticate correctly.
2. **Make demo mode explicit rather than implicit.** Retain the labelled preview buttons and the demo banner, and ensure a preview selection is cleared when a real sign-in begins (already done in `signIn`) and when a live session is detected at bootstrap.
3. **Tighten the banner wording** (`portal-shell.tsx:166-168`) from "using backend test services and demo data" to "using synthetic demo data (no backend session)" so it is unambiguous.
4. **Optional guard:** if a `localStorage` preview key exists while a valid live session is being restored, prefer live mode (or clear the stale key) to close the shadowing risk.
5. **Optional:** stop using real-looking addresses for fixtures (e.g. use `demo+citizen@credlink.test`) to remove the inherent collision with seeded accounts.

---

## 10. Manual verification checklist

- Open `/login`; confirm the preview buttons are labelled synthetic and that clicking one shows the demo banner in `/portal`.
- Note the identity shown in the banner, then sign out ("Exit preview") and confirm you return to `/login`.
- Enter a **non-fixture** email + password; confirm the request goes to `POST /api/auth/login` (Network tab) and that `GET /api/auth/me` returns the real profile with no demo banner.
- Enter `admin@credlink.org` (a fixture email) + the real password; confirm the current behavior is demo mode with no network call to `/api/auth/login` (this demonstrates the defect in §8.5).
- Reload `/portal` after a preview and after a live sign-in; confirm the correct data source and banner state persist respectively.
- Sign out of a live session and confirm `/portal` shows "Session required" and redirects to `/login`.
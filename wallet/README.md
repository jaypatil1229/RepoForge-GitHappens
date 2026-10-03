# CredLink Wallet PWA

The wallet uses the CredLink backend as its source of truth. Citizen credentials, requests, and consent receipts are loaded through authenticated API routes; the service worker caches only the app shell and static assets, not account data.

## Local setup

1. Start the backend from `backend/` with its development environment configured.
2. Copy `.env.example` to `.env.local` in this folder.
3. Keep `NEXT_PUBLIC_API_URL=http://localhost:5000` for the local backend. For Realtime updates, set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` to the Supabase project URL and publishable/anon key. Do not use a service-role or secret key in the wallet.
4. Install and run the wallet:

   ```powershell
   cd wallet
   corepack pnpm install
   corepack pnpm dev
   ```

   Open `http://localhost:3000`. Sign in with a citizen account. Camera access is available on localhost; deployed camera access requires HTTPS.

## Enable database Realtime

The wallet subscribes to authenticated changes for the current citizen's profile, credentials, and consent rows. Apply `backend/migrations/003_wallet_realtime_publication.sql` in the Supabase SQL editor after the schema and row-level security policies are present. The migration adds those tables to the existing `supabase_realtime` publication without duplicating existing entries. The existing RLS policies must remain enabled; Realtime is authenticated with the citizen's access token.

If the Realtime environment values or publication are unavailable, the wallet refreshes data every 15 seconds and when the app regains focus. The Profile screen shows whether the current session is live, polling, or offline.

## Test the consent QR flow

1. Sign in to the portal as an authorized verifier and create a consent request for the citizen account.
2. Open that request's QR code in the portal.
3. Sign in to the wallet as the target citizen, choose **Scan Verification Request**, and grant camera permission. Use **Scan a QR image** if testing on a device without a camera.
4. Confirm the requester, purpose, eligibility, and claims shown by the backend. Approve selected claims or deny the request.
5. Confirm the saved decision in the receipt and Activity screens. The portal should show the updated consent state; with Realtime enabled, the wallet refreshes relevant database changes while open.

QR scanning requires a valid CredLink `consent_request` QR, not a screenshot of the demo viewfinder or a credential QR. Consent authorization and eligibility are checked by the backend; a scanned QR alone never shares credential data.

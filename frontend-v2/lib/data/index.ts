/**
 * The single swap point between the design preview and a live backend.
 *
 * Passing an actor means "render the synthetic preview for this account". Passing
 * `null` means "use the live session": the returned client calls same-origin Next
 * route handlers, which hold the HttpOnly session cookie and attach the Bearer
 * token server-side. No component imports anything below this file, so nothing
 * else changes when the transport changes.
 *
 * Known contract mismatches are corrected inside the live client and its adapters
 * rather than in the screens:
 *  - F-05  consent expiry is `expiresAt` (ISO).
 *  - F-06  the verification result is mapped from the comprehensive report.
 *  - F-01  a revoked credential's reason is read back from the audit trail.
 *  - F-10  a consumed consent is stored as `EXPIRED`, with `consumedAt` set.
 *  - F-11  organization domain and credential domain are separate vocabularies.
 *  - F-12  list `search` is filtered client-side because the API ignores it.
 */

import { createMockDataClient } from '@/lib/data/mock-client';
import { createLiveDataClient } from '@/lib/data/live-client';
import type { ActorContext, DataClient } from '@/lib/data/types';

export function createDataClient(actor: ActorContext | null): DataClient {
  return actor ? createMockDataClient(actor) : createLiveDataClient();
}

export { TransportError, CREDENTIAL_DOMAIN_BY_ORG_DOMAIN } from '@/lib/data/mock-client';
export { SESSION_EXPIRED_EVENT, setLiveActor } from '@/lib/data/live-client';
export type * from '@/lib/data/types';

/**
 * The synthetic accounts a visitor can browse as. Presentation code reads this list
 * through the data layer rather than importing fixtures, so the preview store stays
 * replaceable and is never confused with a live session.
 */
export { demoAccounts as previewAccounts } from '@/lib/mock/fixtures';
export type { DemoAccountSeed } from '@/lib/mock/fixtures';
export { DEMO_NOW } from '@/lib/mock/fixtures';
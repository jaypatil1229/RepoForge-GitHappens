/**
 * The single swap point between the design preview and a live backend.
 *
 * Today `createDataClient` always returns the in-memory mock. When the API is ready,
 * replace the body with a fetch-based implementation of the same `DataClient`
 * interface, constructed with the caller's bearer token instead of a demo actor.
 * No component imports anything below this file, so nothing else changes.
 *
 * Known contract mismatches carried into the mock deliberately, so the UI is built
 * against reality rather than a convenient fiction:
 *  - F-05  consent expiry is `expiresAt` (ISO). The old client sent `expiresInDays`.
 *  - F-06  the verification result shape follows the backend, not the old client types.
 *  - F-01  a revoked credential's reason is read back from the audit trail.
 *  - F-10  a consumed consent is stored as `EXPIRED`, with `consumedAt` set.
 *  - F-11  organization domain and credential domain are separate vocabularies.
 *  - F-12  audit `search` is filtered client-side because the API ignores it.
 */

import { createMockDataClient } from '@/lib/data/mock-client';
import type { ActorContext, DataClient } from '@/lib/data/types';

export function createDataClient(actor: ActorContext | null): DataClient {
  return createMockDataClient(actor);
}

export { TransportError, CREDENTIAL_DOMAIN_BY_ORG_DOMAIN } from '@/lib/data/mock-client';
export type * from '@/lib/data/types';
/**
 * The synthetic accounts a visitor can browse as. Presentation code reads this list
 * through the data layer rather than importing fixtures, so the mock store stays
 * replaceable.
 */
export { demoAccounts as previewAccounts } from '@/lib/mock/fixtures';
export type { DemoAccountSeed } from '@/lib/mock/fixtures';
export { DEMO_NOW } from '@/lib/mock/fixtures';
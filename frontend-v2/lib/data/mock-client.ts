/**
 * Mock implementation of the CredLink data client.
 *
 * This module is the only place that knows the demo data is in memory. Every method
 * mirrors a verified backend endpoint (docs/FRONTEND_RECONNAISSANCE.md section 6) and
 * applies the same authorization scoping the service layer applies (section 4), so a
 * later swap to a fetch-based client is a body replacement rather than a redesign.
 *
 * Two failure channels, matching the real API:
 *  - business and authorization failures return `{ success: false, error, details }`
 *    with the HTTP status they correspond to (400, 403, 404).
 *  - transport failures throw `TransportError`, which is what a network outage or a
 *    503 from the API looks like to the caller.
 * Nothing here silently succeeds after a failure.
 */

import type { AccountRole, ApiResponse, AuthUserRecord, OrganizationMembership, ProfileRecord } from '@/lib/types';
import { DEMO_NOW, auditSeeds, consentSeeds, credentialSeeds, demoAccounts, demoSignature, organizations, organizationsById, profileById, profiles, trustEntries } from '@/lib/mock/fixtures';
import { sleep } from '@/lib/utils';
import type {
  ActorContext,
  AuditQuery,
  ConsentQuery,
  CreateOrganizationInput,
  CredentialQuery,
  DataClient,
  IssueCredentialInput,
  OrganizationQuery,
  PagedResult,
  RequestConsentInput,
  RegisterInput,
  RegisterResult,
  SignInInput,
  SignInResult,
  TrustQuery,
  VerifyInput,
} from '@/lib/data/types';
import type {
  AuditLogRecord,
  CitizenSummary,
  ConsentRecord,
  CredentialRecord,
  OrganizationSummary,
  SharedAccessResult,
  TrustRegistryEntry,
  VerificationCheck,
} from '@/lib/types';

export class TransportError extends Error {
  readonly status = 503;
  constructor(message = 'The service could not be reached. Check your connection and try again.') {
    super(message);
    this.name = 'TransportError';
  }
}

/**
 * Organization domain and credential domain are different vocabularies for the same
 * idea (finding F-11). Every conversion in the app goes through this map so the two
 * never drift: organizations are stored as `college`, credentials as `education`.
 */
export const CREDENTIAL_DOMAIN_BY_ORG_DOMAIN: Record<string, 'education' | 'employment' | 'finance' | 'healthcare' | null> = {
  college: 'education',
  employer: 'employment',
  bank: 'finance',
  hospital: 'healthcare',
  network_admin: null,
};

export function hashString(value: string): number {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }
  return hash;
}

const LATENCY = { list: 240, detail: 180, write: 420, auth: 520 };

function nowIso() {
  return new Date().toISOString();
}

function ok<T>(data: T, message?: string): ApiResponse<T> {
  return { success: true, data, message, timestamp: nowIso() };
}

function business<T>(error: string, details?: { field: string; message: string }[]): ApiResponse<T> {
  return { success: false, error, details, timestamp: nowIso() };
}

/** Mirrors the API's "not found, or out of scope" behaviour: never leak existence. */
function notFound<T>(what = 'Record'): ApiResponse<T> {
  return business<T>(`${what} not found.`);
}

function paginate<T>(items: T[], page = 1, limit = 10): PagedResult<T> {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const start = (page - 1) * limit;
  return { items: items.slice(start, start + limit), pagination: { page, limit, total, totalPages } };
}

function matches(haystack: (string | null | undefined)[], needle?: string) {
  if (!needle || needle.trim().length === 0) return true;
  const needleLower = needle.trim().toLowerCase();
  return haystack.some((value) => (value ?? '').toLowerCase().includes(needleLower));
}

/** Display-only credentials: scoped in-memory store. Resets on reload, like any demo. */
function createStore() {
  return {
    credentials: credentialSeeds.map((seed) => seed),
    consents: consentSeeds.map((seed) => seed),
    organizations: organizations.map((org) => org),
    trust: trustEntries.map((entry) => entry),
    audit: auditSeeds.map((entry) => entry),
    profiles: profiles.map((profile) => profile),
  };
}

export function createMockDataClient(actor: ActorContext | null): DataClient {
  const store = createStore();

  const hydrateCredential = (record: (typeof store.credentials)[number]): CredentialRecord => {
    const issuerOrg = organizationsById[record.issuerOrgId];
    return {
      ...record,
      ...deriveRevocation(record),
      subjectName: profileById[record.subjectId]?.fullName ?? null,
      issuer: issuerOrg ? { id: issuerOrg.id, name: issuerOrg.name, did: issuerOrg.did } : null,
    };
  };

  const hydrateConsent = (record: (typeof store.consents)[number]): ConsentRecord => {
    const credential = store.credentials.find((item) => item.id === record.credentialId);
    const requester = organizationsById[record.requestingOrgId];
    const citizen = profileById[record.citizenId];
    return {
      ...record,
      citizenName: citizen?.fullName ?? null,
      citizenEmail: citizen?.email ?? null,
      requestingOrg: requester ? { id: requester.id, name: requester.name, code: requester.code } : null,
      credential: credential
        ? { id: credential.id, title: credential.title, credentialType: credential.credentialType, status: credential.status }
        : null,
    };
  };

  /** Lazily applied expiry, as the backend does on list. */
  const applyLazyExpiry = (record: (typeof store.consents)[number]) => {
    if ((record.status === 'APPROVED' || record.status === 'PENDING') && record.expiresAt) {
      if (new Date(record.expiresAt).getTime() < DEMO_NOW.getTime()) {
        record.status = 'EXPIRED';
        record.updatedAt = DEMO_NOW.toISOString();
      }
    }
    return record;
  };

  const getProfileRecord = (userId: string) => store.profiles.find((profile) => profile.id === userId);

  const buildUser = (): AuthUserRecord | null => {
    if (!actor) return null;
    const profile = getProfileRecord(actor.userId);
    if (!profile) return null;
    const org = actor.organizationId ? store.organizations.find((item) => item.id === actor.organizationId) : null;
    const orgProfile = org ?? organizationsById['org-governance'];
    return {
      id: profile.id,
      email: profile.email,
      fullName: profile.fullName,
      phone: profile.phone,
      role: profile.role,
      status: profile.accountStatus,
      organizationId: org?.id ?? null,
      organizationName: org?.name ?? 'CredLink Network Governance',
      organizationCode: org?.code ?? null,
      organizationDomain: org?.domain ?? null,
      organizationDid: orgProfile?.did ?? '',
      organizationStatus: org?.verificationStatus ?? null,
      isIssuer: org?.isIssuer ?? false,
      authorizedCredentialTypes: org?.authorizedCredentialTypes ?? [],
      createdAt: profile.createdAt,
    };
  };

  const buildMemberships = (organizationId: string | null): OrganizationMembership[] => {
    if (!actor || !organizationId) return [];
    const org = store.organizations.find((item) => item.id === organizationId);
    if (!org) return [];
    const seed = demoAccounts.find((account) => account.organizationId === organizationId);
    return [
      {
        id: seed?.membershipId ?? `mem-${organizationId}`,
        memberRole: actor.memberRole ?? 'MEMBER',
        status: 'ACTIVE',
        organization: org,
      },
    ];
  };

  const unauthenticated = <T,>(): ApiResponse<T> =>
    business<T>('Sign in to continue.', [{ field: 'authorization', message: 'A valid session is required.' }]);

  const forbidden = <T,>(why: string): ApiResponse<T> => business<T>(why);

  const visibleCredentials = () => {
    if (!actor) return [];
    if (actor.role === 'ADMIN') return store.credentials;
    if (actor.role === 'CITIZEN') return store.credentials.filter((item) => item.subjectId === actor.userId);
    const orgId = actor.organizationId;
    if (!orgId) return [];
    const requestedIds = new Set(
      store.consents.filter((consent) => consent.requestingOrgId === orgId).map((consent) => consent.credentialId),
    );
    return store.credentials.filter((item) => item.issuerOrgId === orgId || requestedIds.has(item.id));
  };

  const canReadCredential = (record: (typeof store.credentials)[number]) => {
    if (!actor) return false;
    if (actor.role === 'ADMIN') return true;
    if (actor.role === 'CITIZEN') return record.subjectId === actor.userId;
    if (!actor.organizationId) return false;
    if (record.issuerOrgId === actor.organizationId) return true;
    return store.consents.some(
      (consent) => consent.requestingOrgId === actor.organizationId && consent.credentialId === record.id,
    );
  };

  const canIssue = () => {
    if (!actor) return false;
    if (actor.role === 'ADMIN') return true;
    if (actor.role === 'CITIZEN' || !actor.organizationId) return false;
    const org = store.organizations.find((item) => item.id === actor.organizationId);
    const roleOk = actor.memberRole === 'ADMIN' || actor.memberRole === 'ISSUER';
    return Boolean(org && org.isIssuer && org.verificationStatus === 'APPROVED' && roleOk);
  };

  /**
   * Revocation detail is read back from the audit trail, exactly as
   * `getRevocationMetadata` does on the backend (finding F-01).
   */
  const deriveRevocation = (record: (typeof store.credentials)[number]) => {
    if (record.status !== 'REVOKED') return { revocationReason: record.revocationReason, revokedAt: record.revokedAt };
    const event = store.audit.find(
      (entry) => entry.eventType === 'CREDENTIAL_REVOKED' && entry.targetResourceId === record.id,
    );
    return {
      revocationReason:
        record.revocationReason ?? (typeof event?.metadata.reason === 'string' ? event.metadata.reason : null),
      revokedAt: record.revokedAt ?? event?.timestamp ?? null,
    };
  };

  const writeAudit = (event: {
    eventType: AuditLogRecord['eventType'];
    action: string;
    domain: string;
    outcome: AuditLogRecord['outcome'];
    targetResourceId: string | null;
    metadata: Record<string, unknown>;
    details: string;
  }) => {
    const profile = actor ? getProfileRecord(actor.userId) : undefined;
    const org = actor?.organizationId ? organizationsById[actor.organizationId] : undefined;
    store.audit.unshift({
      id: `aud-${9100 + store.audit.length}`,
      timestamp: new Date().toISOString(),
      eventType: event.eventType,
      action: event.action,
      domain: event.domain,
      outcome: event.outcome,
      actor: profile?.fullName ?? 'Unknown actor',
      actorId: profile?.id ?? null,
      organization: org?.name ?? 'CredLink Network Governance',
      organizationId: org?.id ?? null,
      targetResourceId: event.targetResourceId,
      metadata: event.metadata,
      details: event.details,
    });
  };

  const visibleConsents = () => {
    if (!actor) return [];
    if (actor.role === 'ADMIN') return store.consents;
    if (actor.role === 'CITIZEN') return store.consents.filter((item) => item.citizenId === actor.userId);
    if (!actor.organizationId) return [];
    return store.consents.filter((item) => item.requestingOrgId === actor.organizationId);
  };

  const canReadConsent = (record: (typeof store.consents)[number]) => {
    if (!actor) return false;
    if (actor.role === 'ADMIN') return true;
    if (actor.role === 'CITIZEN') return record.citizenId === actor.userId;
    return record.requestingOrgId === actor.organizationId;
  };

  const canRequestConsent = () => {
    if (!actor) return false;
    if (actor.role === 'ADMIN') return true;
    return Boolean(actor.organizationId && actor.memberRole && actor.memberRole !== 'MEMBER');
  };

  const visibleAudit = () => {
    if (!actor) return [];
    if (actor.role === 'ADMIN') return store.audit;
    if (actor.organizationId) {
      return store.audit.filter(
        (item) => item.organizationId === actor.organizationId || item.actorId === actor.userId,
      );
    }
    return store.audit.filter((item) => item.actorId === actor.userId);
  };

  const evaluateTrust = (issuerOrgId: string, domain: CredentialRecord['domain']) => {
    const entry = store.trust.find((item) => item.organizationId === issuerOrgId);
    const issuer = organizationsById[issuerOrgId];
    if (!entry) {
      return {
        issuerDid: issuer?.did ?? '',
        issuerName: issuer?.name,
        isTrusted: false,
        trustStatus: 'UNREGISTERED' as const,
        accreditedFor: null,
        requiredDomain: domain,
      };
    }
    return {
      issuerDid: entry.issuerIdentifier,
      issuerName: issuer?.name,
      isTrusted: entry.trustStatus === 'VERIFIED',
      trustStatus: entry.trustStatus,
      accreditedFor: entry.verificationMetadata.accreditedFor ?? null,
      requiredDomain: domain,
    };
  };

  return {
    mode: 'mock',

    async signIn(input: SignInInput): Promise<ApiResponse<SignInResult>> {
      await sleep(LATENCY.auth);
      if (input.simulateOffline) {
        throw new TransportError('The service could not be reached. Check your connection and try again.');
      }
      const seed = demoAccounts.find((account) => account.email.toLowerCase() === input.email.trim().toLowerCase());
      if (!seed) {
        return business<SignInResult>('No account matches that email address.', [
          { field: 'email', message: 'Use one of the demo accounts listed on this page.' },
        ]);
      }
      if (seed.accountStatus === 'SUSPENDED') {
        return business<SignInResult>('This account is suspended. Contact your network administrator.');
      }
      const profile = store.profiles.find((item) => item.email.toLowerCase() === seed.email);
      if (!profile) return business<SignInResult>('The account profile could not be resolved.');
      const org = seed.organizationId ? store.organizations.find((item) => item.id === seed.organizationId) : null;
      const orgReference = org ?? organizationsById['org-governance'];
      return ok<SignInResult>(
        {
          mode: 'demo',
          session: null,
          user: {
            id: profile.id,
            email: profile.email,
            fullName: profile.fullName,
            phone: profile.phone,
            role: profile.role,
            status: profile.accountStatus,
            organizationId: org?.id ?? null,
            organizationName: org?.name ?? 'CredLink Network Governance',
            organizationCode: org?.code ?? null,
            organizationDomain: org?.domain ?? null,
            organizationDid: orgReference?.did ?? '',
            organizationStatus: org?.verificationStatus ?? null,
            isIssuer: org?.isIssuer ?? false,
            authorizedCredentialTypes: org?.authorizedCredentialTypes ?? [],
            createdAt: profile.createdAt,
          },
          memberships: seed.organizationId
            ? [
                {
                  id: seed.membershipId ?? 'mem',
                  memberRole: seed.memberRole ?? 'MEMBER',
                  status: 'ACTIVE',
                  organization: org ?? organizationsById['org-governance']!,
                },
              ]
            : [],
        },
        'Signed in to the design preview. No authentication service is connected, so no token was issued.',
      );
    },

    async register(input: RegisterInput) {
      await sleep(LATENCY.auth);
      if (!input.email.includes('@') || input.email.trim().length < 5) {
        return business<RegisterResult>('Enter a valid email address.', [
          { field: 'email', message: 'That email address is not valid.' },
        ]);
      }
      if (input.password.trim().length < 8) {
        return business<RegisterResult>('Choose a longer password.', [
          { field: 'password', message: 'Use at least 8 characters.' },
        ]);
      }
      if (input.fullName.trim().length < 2) {
        return business<RegisterResult>('Enter your full name.', [
          { field: 'fullName', message: 'Your name must be at least 2 characters.' },
        ]);
      }
      if (store.profiles.some((profile) => profile.email.toLowerCase() === input.email.trim().toLowerCase())) {
        return business<RegisterResult>('An account with that email already exists.', [
          { field: 'email', message: 'Sign in instead, or use a different address.' },
        ]);
      }
      // The backend silently downgrades a self-assigned ADMIN role to CITIZEN.
      const assignedRole: AccountRole = input.requestedRole === 'ADMIN' ? 'CITIZEN' : input.requestedRole;
      const id = `usr-${input.email.split('@')[0]!.replace(/[^a-z0-9]/gi, '').toLowerCase()}`;
      const timestamp = new Date().toISOString();
      const profile: ProfileRecord = {
        id,
        fullName: input.fullName.trim(),
        email: input.email.trim().toLowerCase(),
        phone: input.phone?.trim() ? input.phone.trim() : null,
        role: assignedRole,
        accountStatus: 'ACTIVE',
        createdAt: timestamp,
        updatedAt: timestamp,
      };
      store.profiles.push(profile);
      return ok<RegisterResult>(
        {
          mode: 'demo',
          session: null,
          assignedRole,
          requestedRole: input.requestedRole,
          roleDowngraded: assignedRole !== input.requestedRole,
          memberships: [],
          user: {
            id: profile.id,
            email: profile.email,
            fullName: profile.fullName,
            phone: profile.phone,
            role: assignedRole,
            status: 'ACTIVE',
            organizationId: null,
            organizationName: 'No organization yet',
            organizationCode: null,
            organizationDomain: null,
            organizationDid: '',
            organizationStatus: null,
            isIssuer: false,
            authorizedCredentialTypes: [],
            createdAt: timestamp,
          },
        },
        'Account created in the design preview. No authentication service is connected, so no token was issued.',
      );
    },

    async getMe() {
      await sleep(LATENCY.detail);
      if (!actor) return unauthenticated();
      const user = buildUser();
      if (!user) return business<{ user: AuthUserRecord; memberships: OrganizationMembership[] }>('The account profile could not be resolved.');
      return ok({ user, memberships: buildMemberships(actor.organizationId) });
    },
    // -- Credentials --------------------------------------------------------

    async listCredentials(query: CredentialQuery = {}) {
      await sleep(LATENCY.list);
      if (!actor) return unauthenticated<PagedResult<CredentialRecord>>();

      let records = visibleCredentials();
      if (query.subjectId) records = records.filter((item) => item.subjectId === query.subjectId);
      if (query.issuerOrgId) records = records.filter((item) => item.issuerOrgId === query.issuerOrgId);
      if (query.domain) records = records.filter((item) => item.domain === query.domain);
      if (query.status) records = records.filter((item) => item.status === query.status);

      const hydrated = records.map(hydrateCredential).sort((a, b) => b.issuanceDate.localeCompare(a.issuanceDate));
      const filtered = hydrated.filter((item) =>
        matches([item.title, item.credentialType, item.subjectName, item.issuer?.name, item.id], query.search),
      );
      return ok(paginate(filtered, query.page, query.limit));
    },

    async getCredential(id: string) {
      await sleep(LATENCY.detail);
      if (!actor) return unauthenticated<CredentialRecord>();
      const record = store.credentials.find((item) => item.id === id);
      if (!record || !canReadCredential(record)) return notFound<CredentialRecord>('Credential');
      return ok(hydrateCredential(record));
    },

    async issueCredential(input: IssueCredentialInput) {
      await sleep(LATENCY.write);
      if (!actor) return unauthenticated<CredentialRecord>();
      if (!canIssue()) {
        return forbidden<CredentialRecord>(
          'This organization is not authorized to issue credentials. Issuance requires an approved issuer organization and an ADMIN or ISSUER membership.',
        );
      }
      const org = store.organizations.find((item) => item.id === actor.organizationId);
      if (!org) return forbidden<CredentialRecord>('Your organization could not be resolved.');
      if (!org.authorizedCredentialTypes.includes(input.credentialType)) {
        return forbidden<CredentialRecord>(
          `${org.name} is not authorized to issue "${input.credentialType}". Authorized types: ${org.authorizedCredentialTypes.join(', ') || 'none'}.`,
        );
      }
      const subject = store.profiles.find((profile) => profile.id === input.subjectId);
      if (!subject || subject.role !== 'CITIZEN') {
        return business<CredentialRecord>('Citizen not found.', [{ field: 'subjectId', message: 'Select a citizen from the directory.' }]);
      }
      const timestamp = DEMO_NOW.toISOString();
      const id = `cred-${1000 + store.credentials.length + 1}`;
      const record: (typeof store.credentials)[number] = {
        id,
        subjectId: subject.id,
        issuerOrgId: org.id,
        domain: input.domain,
        credentialType: input.credentialType,
        title: input.title,
        claims: input.claims,
        issuanceDate: timestamp,
        expirationDate: input.expiresAt ?? null,
        status: 'VALID',
        revocationReason: null,
        revokedAt: null,
        issuerSignature: demoSignature(id),
        qrPayload: `credlink:vc:${id}:${id.slice(-6)}`,
        createdAt: timestamp,
        updatedAt: timestamp,
      };
      store.credentials.unshift(record);
      writeAudit({
        eventType: 'CREDENTIAL_ISSUED',
        action: 'Credential issued',
        domain: input.domain,
        outcome: 'SUCCESS',
        targetResourceId: id,
        metadata: { credentialType: input.credentialType, subject: subject.fullName },
        details: `${org.name} issued a ${input.credentialType} to ${subject.fullName}.`,
      });
      return ok(hydrateCredential(record), 'Credential issued and signed.');
    },

    async revokeCredential(id: string, reason: string) {
      await sleep(LATENCY.write);
      if (!actor) return unauthenticated<CredentialRecord>();
      const record = store.credentials.find((item) => item.id === id);
      if (!record || !canReadCredential(record)) return notFound<CredentialRecord>('Credential');
      if (record.status === 'REVOKED') return business<CredentialRecord>('This credential is already revoked.');
      if (!(actor.role === 'ADMIN' || (record.issuerOrgId === actor.organizationId && (actor.memberRole === 'ADMIN' || actor.memberRole === 'ISSUER')))) {
        return forbidden<CredentialRecord>('Only the issuing organization (ADMIN or ISSUER membership) or a network administrator can revoke this credential.');
      }
      if (!reason || reason.trim().length < 10) {
        return business<CredentialRecord>('A revocation reason is required.', [
          { field: 'reason', message: 'Explain why this record is being revoked. Minimum 10 characters.' },
        ]);
      }
      // The service updates only `status`. Reason and timestamp live on the audit event
      // (finding F-01), which is why the stored columns stay null.
      record.status = 'REVOKED';
      record.updatedAt = DEMO_NOW.toISOString();
      writeAudit({
        eventType: 'CREDENTIAL_REVOKED',
        action: 'Credential revoked',
        domain: record.domain,
        outcome: 'SUCCESS',
        targetResourceId: record.id,
        metadata: { reason },
        details: `${actor.organizationId ? organizationsById[actor.organizationId]?.name ?? 'The issuer' : 'A network administrator'} revoked a ${record.credentialType}.`,
      });
      return ok(
        { ...hydrateCredential(record), revocationReason: reason, revokedAt: DEMO_NOW.toISOString() },
        'Credential revoked. Subsequent verifications will fail with the recorded reason.',
      );
    },
    // -- Consents -----------------------------------------------------------

    async listConsents(query: ConsentQuery = {}) {
      await sleep(LATENCY.list);
      if (!actor) return unauthenticated<PagedResult<ConsentRecord>>();
      store.consents.forEach(applyLazyExpiry);

      let records = visibleConsents();
      if (query.citizenId) records = records.filter((item) => item.citizenId === query.citizenId);
      if (query.requestingOrgId) records = records.filter((item) => item.requestingOrgId === query.requestingOrgId);
      if (query.credentialId) records = records.filter((item) => item.credentialId === query.credentialId);
      if (query.domain) records = records.filter((item) => item.domain === query.domain);
      if (query.status) records = records.filter((item) => item.status === query.status);

      const hydrated = records
        .map(hydrateConsent)
        .sort((a, b) => {
          const weight = (status: ConsentRecord['status']) => (status === 'PENDING' ? 0 : 1);
          const delta = weight(a.status) - weight(b.status);
          return delta !== 0 ? delta : b.createdAt.localeCompare(a.createdAt);
        });
      const filtered = hydrated.filter((item) =>
        matches([item.citizenName, item.requestingOrg?.name, item.purpose, item.credential?.title, item.id], query.search),
      );
      return ok(paginate(filtered, query.page, query.limit));
    },

    async getConsent(id: string) {
      await sleep(LATENCY.detail);
      if (!actor) return unauthenticated<ConsentRecord>();
      const record = store.consents.find((item) => item.id === id);
      if (!record || !canReadConsent(record)) return notFound<ConsentRecord>('Request');
      return ok(hydrateConsent(applyLazyExpiry(record)));
    },

    async requestConsent(input: RequestConsentInput) {
      await sleep(LATENCY.write);
      if (!actor) return unauthenticated<ConsentRecord>();
      if (!canRequestConsent()) {
        return forbidden<ConsentRecord>('Only an active member of the requesting organization, or a network administrator, can request consent.');
      }
      const requestingOrgId = actor.role === 'ADMIN' ? actor.organizationId : actor.organizationId;
      if (!requestingOrgId) return forbidden<ConsentRecord>('Your organization could not be resolved.');
      const citizen = store.profiles.find((profile) => profile.id === input.citizenId);
      if (!citizen) return notFound<ConsentRecord>('Citizen');
      const credential = store.credentials.find((item) => item.id === input.credentialId);
      if (!credential) return notFound<ConsentRecord>('Credential');
      // The service requires the credential to belong to the named citizen.
      if (credential.subjectId !== input.citizenId) return notFound<ConsentRecord>('Credential');
      if (input.requestedClaims.length === 0) {
        return business<ConsentRecord>('Select at least one claim to request.', [
          { field: 'requestedClaims', message: 'A request must ask for specific claims.' },
        ]);
      }
      const timestamp = DEMO_NOW.toISOString();
      const id = `cons-${3000 + store.consents.length + 1}`;
      store.consents.unshift({
        id,
        citizenId: input.citizenId,
        requestingOrgId,
        credentialId: input.credentialId,
        domain: credential.domain,
        purpose: input.purpose,
        requestedClaims: input.requestedClaims,
        approvedClaims: [],
        status: 'PENDING',
        grantedAt: null,
        expiresAt: input.expiresAt ?? null,
        consumedAt: null,
        createdAt: timestamp,
        updatedAt: timestamp,
      });
      writeAudit({
        eventType: 'VERIFICATION_REQUESTED',
        action: 'Consent requested',
        domain: credential.domain,
        outcome: 'SUCCESS',
        targetResourceId: id,
        metadata: { requestedClaims: input.requestedClaims, expiresAt: input.expiresAt ?? null },
        details: `${organizationsById[requestingOrgId]?.name ?? 'The requesting organization'} asked ${citizen.fullName} for ${input.requestedClaims.length} claim(s).`,
      });
      const created = store.consents.find((item) => item.id === id)!;
      return ok(hydrateConsent(created), 'Request sent. The citizen decides which claims to share.');
    },

    async respondConsent(id: string, decision) {
      await sleep(LATENCY.write);
      if (!actor) return unauthenticated<ConsentRecord>();
      const record = store.consents.find((item) => item.id === id);
      if (!record) return notFound<ConsentRecord>('Request');
      const isSubject = actor.role === 'CITIZEN' && record.citizenId === actor.userId;
      if (!isSubject && actor.role !== 'ADMIN') {
        return forbidden<ConsentRecord>('Only the citizen this request is addressed to can respond.');
      }
      if (record.status !== 'PENDING') {
        return business<ConsentRecord>(`This request is no longer awaiting a decision (it is ${record.status.toLowerCase()}).`);
      }
      const approved =
        decision.action === 'APPROVE'
          ? (decision.approvedClaims && decision.approvedClaims.length > 0 ? decision.approvedClaims : record.requestedClaims)
          : [];
      if (decision.action === 'APPROVE' && approved.length === 0) {
        return business<ConsentRecord>('Select at least one claim to share.');
      }
      record.status = decision.action === 'APPROVE' ? 'APPROVED' : 'DENIED';
      record.approvedClaims = approved;
      // The API's decision payload carries an ISO `expiresAt`; a denial clears any window.
      if (decision.action === 'APPROVE') {
        if (decision.expiresAt) record.expiresAt = decision.expiresAt;
      } else {
        record.expiresAt = null;
      }
      record.grantedAt = decision.action === 'APPROVE' ? DEMO_NOW.toISOString() : null;
      record.updatedAt = DEMO_NOW.toISOString();
      writeAudit({
        eventType: decision.action === 'APPROVE' ? 'CONSENT_GRANTED' : 'CONSENT_REVOKED',
        action: decision.action === 'APPROVE' ? 'Consent approved' : 'Consent denied',
        domain: record.domain,
        outcome: 'SUCCESS',
        targetResourceId: record.id,
        metadata: { decision: decision.action, approvedClaims: approved },
        details:
          decision.action === 'APPROVE'
            ? `${approved.length} of ${record.requestedClaims.length} requested claims were shared with ${organizationsById[record.requestingOrgId]?.name ?? 'the requester'}.`
            : `The request from ${organizationsById[record.requestingOrgId]?.name ?? 'the requester'} was declined.`,
      });
      return ok(hydrateConsent(record), decision.action === 'APPROVE' ? 'Sharing approved.' : 'Request declined.');
    },

    async revokeConsent(id: string) {
      await sleep(LATENCY.write);
      if (!actor) return unauthenticated<ConsentRecord>();
      const record = store.consents.find((item) => item.id === id);
      if (!record) return notFound<ConsentRecord>('Request');
      const isSubject = actor.role === 'CITIZEN' && record.citizenId === actor.userId;
      if (!isSubject && actor.role !== 'ADMIN') return forbidden<ConsentRecord>('Only the citizen who granted access can withdraw it.');
      if (record.status !== 'APPROVED') {
        return business<ConsentRecord>('Only an approval that is still usable can be withdrawn.');
      }
      record.status = 'REVOKED';
      record.updatedAt = DEMO_NOW.toISOString();
      writeAudit({
        eventType: 'CONSENT_REVOKED',
        action: 'Consent withdrawn',
        domain: record.domain,
        outcome: 'SUCCESS',
        targetResourceId: record.id,
        metadata: { previousStatus: 'APPROVED', decision: 'REVOKED' },
        details: `Access granted to ${organizationsById[record.requestingOrgId]?.name ?? 'the requester'} was withdrawn.`,
      });
      return ok(hydrateConsent(record), 'Access withdrawn. The requester can no longer verify with this consent.');
    },

    async accessSharedCredential(input: { credentialId: string }) {
      await sleep(LATENCY.detail);
      if (!actor) return unauthenticated<SharedAccessResult>();
      const credential = store.credentials.find((item) => item.id === input.credentialId);
      if (!credential) return notFound<SharedAccessResult>('Credential');
      const consent = store.consents.find(
        (item) =>
          item.credentialId === credential.id &&
          item.requestingOrgId === actor.organizationId &&
          item.status === 'APPROVED',
      );
      if (!consent) return forbidden<SharedAccessResult>('No usable consent covers this credential for your organization.');
      return ok<SharedAccessResult>({
        sharedClaims: pickClaims(credential, consent.approvedClaims),
        consentId: consent.id,
        credentialId: credential.id,
        requestingOrgId: consent.requestingOrgId,
        requestedClaims: consent.requestedClaims,
        approvedClaims: consent.approvedClaims,
        purpose: consent.purpose,
        status: 'GRANTED',
        grantedAt: consent.grantedAt ?? DEMO_NOW.toISOString(),
      });
    },
    // -- Verification -------------------------------------------------------

    async verifyCredential(input: VerifyInput) {
      await sleep(LATENCY.write);
      if (!actor) return unauthenticated<VerificationCheck>();
      const record = store.credentials.find((item) => item.id === input.credentialId);
      if (!record || !canReadCredential(record)) return notFound<VerificationCheck>('Credential');
      const issuer = organizationsById[record.issuerOrgId];

      const cryptographicCheck = {
        signatureValid: Boolean(record.issuerSignature),
        algorithm: 'EdDSA (Ed25519) JWT via Veramo',
        verifiedAt: new Date().toISOString(),
      };
      const lifecycle = evaluateLifecycle(record, DEMO_NOW);
      const trust = evaluateTrust(record.issuerOrgId, record.domain);
      const consent = input.consentId ? store.consents.find((item) => item.id === input.consentId) : undefined;

      const credentialSummary = {
        id: record.id,
        subjectId: record.subjectId,
        domain: record.domain,
        credentialType: record.credentialType,
        title: record.title,
        status: record.status,
      };

      const reject = (reason: string, extra: Partial<VerificationCheck> = {}): ApiResponse<VerificationCheck> => {
        writeAudit({
          eventType: 'VERIFICATION_APPROVED',
          action: 'Verification rejected',
          domain: record.domain,
          outcome: 'FAILURE',
          targetResourceId: record.id,
          metadata: { verificationResult: 'REJECTED', failureReason: reason },
          details: `Verification of ${record.title} was rejected: ${reason}`,
        });
        return ok<VerificationCheck>({
          verified: false,
          verificationResult: 'REJECTED',
          reason,
          mode: input.consentId ? 'BANK_VERIFICATION_REQUEST' : 'BASIC_VERIFICATION',
          credentialSummary,
          cryptographicCheck,
          lifecycleCheck: lifecycle,
          trustRegistryCheck: trust,
          consentDetails: null,
          ...extra,
        });
      };

      if (!cryptographicCheck.signatureValid) return reject('The credential signature could not be verified.');
      if (lifecycle.isRevoked) {
        const meta = deriveRevocation(record);
        return reject(meta.revocationReason ? `Credential revoked: ${meta.revocationReason}` : 'The credential has been revoked.');
      }
      if (lifecycle.isExpired) return reject('The credential expired on a date in the past.');
      if (!trust.isTrusted) {
        return reject(
          trust.trustStatus === 'UNREGISTERED'
            ? 'The issuer is not registered in the trust registry.'
            : `The issuer is ${trust.trustStatus.toLowerCase()} in the trust registry.`,
        );
      }
      if (trust.accreditedFor && trust.accreditedFor !== record.domain) {
        return reject(`The issuer is not accredited for ${record.domain} credentials.`);
      }
      if (consent) {
        if (consent.status !== 'APPROVED') {
          return reject(
            consent.status === 'PENDING'
              ? 'The citizen has not decided on this request yet.'
              : `No usable consent covers this request (consent is ${consent.status.toLowerCase()}).`,
          );
        }
        const allowedClaims = pickClaims(record, consent.approvedClaims);
        const consumedAt = new Date().toISOString();
        consent.status = 'EXPIRED';
        consent.consumedAt = consumedAt;
        consent.updatedAt = consumedAt;
        writeAudit({
          eventType: 'VERIFICATION_APPROVED',
          action: 'Verification approved',
          domain: record.domain,
          outcome: 'SUCCESS',
          targetResourceId: record.id,
          metadata: { consentId: consent.id, allowedClaims: Object.keys(allowedClaims), mode: 'BANK_VERIFICATION_REQUEST' },
          details: `Verified ${record.title}. ${Object.keys(allowedClaims).length} claim(s) released; the consent is now consumed.`,
        });
        return ok<VerificationCheck>({
          verified: true,
          verificationResult: 'APPROVED',
          reason: null,
          mode: 'BANK_VERIFICATION_REQUEST',
          credentialSummary,
          allowedClaims,
          cryptographicCheck,
          lifecycleCheck: lifecycle,
          trustRegistryCheck: trust,
          consentDetails: { consentId: consent.id, status: 'CONSUMED', consumedAt, purpose: consent.purpose },
        });
      }
      writeAudit({
        eventType: 'VERIFICATION_APPROVED',
        action: 'Verification approved',
        domain: record.domain,
        outcome: 'SUCCESS',
        targetResourceId: record.id,
        metadata: { mode: 'BASIC_VERIFICATION', issuer: issuer?.name ?? null },
        details: `Signature, issuer trust and lifecycle checks passed for ${record.title}.`,
      });
      return ok<VerificationCheck>({
        verified: true,
        verificationResult: 'APPROVED',
        reason: null,
        mode: 'BASIC_VERIFICATION',
        credentialSummary,
        cryptographicCheck,
        lifecycleCheck: lifecycle,
        trustRegistryCheck: trust,
        consentDetails: null,
      });
    },

    // -- Organizations and trust --------------------------------------------

    async listOrganizations(query: OrganizationQuery = {}) {
      await sleep(LATENCY.list);
      if (!actor) return unauthenticated<PagedResult<OrganizationSummary>>();
      let records = store.organizations;
      if (query.domain) records = records.filter((item) => item.domain === query.domain);
      if (query.verificationStatus) records = records.filter((item) => item.verificationStatus === query.verificationStatus);
      const filtered = records
        .filter((item) => matches([item.name, item.code, item.did, item.domain], query.search))
        .sort((a, b) => a.name.localeCompare(b.name));
      return ok(paginate(filtered, query.page, query.limit));
    },

    async getOrganization(id: string) {
      await sleep(LATENCY.detail);
      if (!actor) return unauthenticated<OrganizationSummary>();
      const record = store.organizations.find((item) => item.id === id);
      if (!record) return notFound<OrganizationSummary>('Organization');
      return ok(record);
    },

    async createOrganization(input: CreateOrganizationInput) {
      await sleep(LATENCY.write);
      if (!actor) return unauthenticated<OrganizationSummary>();
      if (!input.name || !input.code) {
        return business<OrganizationSummary>('Name and code are required.', [
          { field: 'name', message: 'Enter the registered institution name.' },
        ]);
      }
      if (store.organizations.some((item) => item.code.toLowerCase() === input.code.trim().toLowerCase())) {
        return business<OrganizationSummary>('An organization with that code already exists.', [
          { field: 'code', message: 'Choose a unique registration code.' },
        ]);
      }
      const id = `org-${input.code.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
      const record: OrganizationSummary = {
        id,
        name: input.name.trim(),
        code: input.code.trim().toUpperCase(),
        domain: input.domain,
        did: `did:key:z6Mk${Math.abs(hashString(id)).toString(36).padEnd(30, 'q')}`,
        verificationStatus: 'PENDING',
        isIssuer: false,
        authorizedCredentialTypes: [],
        registrationRef: input.registrationRef ?? null,
        createdAt: new Date().toISOString(),
      };
      store.organizations.push(record);
      writeAudit({
        eventType: 'ORGANIZATION_STATUS_CHANGED',
        action: 'Organization registered',
        domain: input.domain,
        outcome: 'PENDING',
        targetResourceId: record.id,
        metadata: { verificationStatus: 'PENDING' },
        details: `${record.name} submitted an organization registration and is awaiting network approval.`,
      });
      return ok(record, 'Registration submitted. A network administrator must approve it before the organization can issue credentials.');
    },

    async updateOrganizationStatus(id, input) {
      await sleep(LATENCY.write);
      if (!actor) return unauthenticated<OrganizationSummary>();
      if (actor.role !== 'ADMIN') return forbidden<OrganizationSummary>('Only a network administrator can change an organization status.');
      const record = store.organizations.find((item) => item.id === id);
      if (!record) return notFound<OrganizationSummary>('Organization');
      const previous = record.verificationStatus;
      record.verificationStatus = input.verificationStatus;
      if (input.isIssuer !== undefined) record.isIssuer = input.isIssuer;
      if (input.authorizedCredentialTypes) record.authorizedCredentialTypes = input.authorizedCredentialTypes;
      const existing = store.organizations.find((item) => item.id === id)!;
      writeAudit({
        eventType: 'ORGANIZATION_STATUS_CHANGED',
        action: 'Organization status changed',
        domain: record.domain,
        outcome: 'SUCCESS',
        targetResourceId: record.id,
        metadata: { previousVerificationStatus: previous, verificationStatus: input.verificationStatus, isIssuer: existing.isIssuer },
        details: `${record.name} moved from ${previous} to ${input.verificationStatus}.`,
      });
      return ok(existing, 'Organization status updated.');
    },

    async listTrustRegistry(query: TrustQuery = {}) {
      await sleep(LATENCY.list);
      if (!actor) return unauthenticated<PagedResult<TrustRegistryEntry>>();
      let records = store.trust;
      if (query.trustStatus) records = records.filter((item) => item.trustStatus === query.trustStatus);
      if (query.domain) {
        records = records.filter((item) => item.verificationMetadata.accreditedFor === query.domain);
      }
      const filtered = records
        .map((item) => ({ ...item, organization: store.organizations.find((org) => org.id === item.organizationId) ?? null }))
        .filter((item) => matches([item.organization?.name, item.issuerIdentifier, item.id], query.search))
        .sort((a, b) => (a.organization?.name ?? '').localeCompare(b.organization?.name ?? ''));
      return ok(paginate(filtered, query.page, query.limit));
    },

    async getTrustEntry(orgIdOrDid: string) {
      await sleep(LATENCY.detail);
      if (!actor) return unauthenticated<TrustRegistryEntry>();
      const record = store.trust.find((item) => item.organizationId === orgIdOrDid || item.issuerIdentifier === orgIdOrDid);
      if (!record) return notFound<TrustRegistryEntry>('Trust registry entry');
      return ok({ ...record, organization: store.organizations.find((org) => org.id === record.organizationId) ?? null });
    },

    async registerTrustIssuer(input) {
      await sleep(LATENCY.write);
      if (!actor) return unauthenticated<TrustRegistryEntry>();
      if (actor.role !== 'ADMIN') return forbidden<TrustRegistryEntry>('Only a network administrator can register an issuer in the trust registry.');
      const org = store.organizations.find((item) => item.id === input.organizationId);
      if (!org) return notFound<TrustRegistryEntry>('Organization');
      if (org.verificationStatus !== 'APPROVED') {
        return business<TrustRegistryEntry>('Approve the organization before registering it in the trust registry.');
      }
      if (store.trust.some((item) => item.organizationId === org.id)) {
        return business<TrustRegistryEntry>('This organization already has a trust registry entry.');
      }
      const accreditedFor = CREDENTIAL_DOMAIN_BY_ORG_DOMAIN[org.domain];
      if (!accreditedFor) {
        return business<TrustRegistryEntry>('Network administration organizations are not registered as credential issuers.');
      }
      const timestamp = new Date().toISOString();
      const record: TrustRegistryEntry = {
        id: `trust-${store.trust.length + 1}`,
        organizationId: org.id,
        issuerIdentifier: org.did,
        organization: org,
        trustStatus: 'VERIFIED',
        verificationMetadata: { accreditedFor, reviewedBy: 'CredLink Network Governance', ...input.verificationMetadata },
        lastVerifiedAt: timestamp,
        createdAt: timestamp,
        updatedAt: timestamp,
      };
      store.trust.push(record);
      writeAudit({
        eventType: 'ORGANIZATION_STATUS_CHANGED',
        action: 'Issuer registered in trust registry',
        domain: accreditedFor,
        outcome: 'SUCCESS',
        targetResourceId: record.id,
        metadata: { trustStatus: 'VERIFIED', accreditedFor },
        details: `${org.name} was registered as a trusted issuer for ${accreditedFor}.`,
      });
      return ok(record, 'Issuer registered. Verification will now accept their proofs.');
    },

    async updateTrustStatus(id, input) {
      await sleep(LATENCY.write);
      if (!actor) return unauthenticated<TrustRegistryEntry>();
      if (actor.role !== 'ADMIN') return forbidden<TrustRegistryEntry>('Only a network administrator can change a trust status.');
      const record = store.trust.find((item) => item.id === id);
      if (!record) return notFound<TrustRegistryEntry>('Trust registry entry');
      const previous = record.trustStatus;
      record.trustStatus = input.trustStatus;
      record.updatedAt = new Date().toISOString();
      if (input.trustStatus !== 'VERIFIED') {
        record.verificationMetadata = {
          ...record.verificationMetadata,
          [input.trustStatus === 'SUSPENDED' ? 'suspensionReason' : 'revocationReason']:
            input.reason ?? 'No reason recorded.',
        };
      }
      record.lastVerifiedAt = new Date().toISOString();
      writeAudit({
        eventType: 'ORGANIZATION_STATUS_CHANGED',
        action: `Trust status ${input.trustStatus.toLowerCase()}`,
        domain: String(record.verificationMetadata.accreditedFor ?? 'all'),
        outcome: 'SUCCESS',
        targetResourceId: record.id,
        metadata: { previousTrustStatus: previous, trustStatus: input.trustStatus, reason: input.reason ?? null },
        details: `${store.organizations.find((org) => org.id === record.organizationId)?.name ?? 'Issuer'} moved from ${previous} to ${input.trustStatus}.`,
      });
      return ok(
        { ...record, organization: store.organizations.find((org) => org.id === record.organizationId) ?? null },
        'Trust status updated. Verifications through this issuer now reflect the new status.',
      );
    },

    // -- Supporting data ----------------------------------------------------

    async listCitizens() {
      await sleep(LATENCY.list);
      if (!actor) return unauthenticated<CitizenSummary[]>();
      return ok(
        store.profiles
          .filter((profile) => profile.role === 'CITIZEN' && profile.accountStatus === 'ACTIVE')
          .map((profile) => ({
            id: profile.id,
            fullName: profile.fullName,
            email: profile.email,
            accountStatus: profile.accountStatus,
            credentialCount: store.credentials.filter((item) => item.subjectId === profile.id).length,
            createdAt: profile.createdAt,
          })),
      );
    },

    async getProfile() {
      await sleep(LATENCY.detail);
      if (!actor) return unauthenticated<ProfileRecord>();
      const record = getProfileRecord(actor.userId);
      if (!record) return notFound<ProfileRecord>('Profile');
      return ok(record);
    },

    async updateProfile(input: { fullName?: string; phone?: string }) {
      await sleep(LATENCY.write);
      if (!actor) return unauthenticated<ProfileRecord>();
      const record = getProfileRecord(actor.userId);
      if (!record) return notFound<ProfileRecord>('Profile');
      if (!input.fullName || input.fullName.trim().length < 2) {
        return business<ProfileRecord>('Enter your full name.', [
          { field: 'fullName', message: 'Your name must be at least 2 characters.' },
        ]);
      }
      record.fullName = input.fullName.trim();
      record.phone = input.phone?.trim() ? input.phone.trim() : null;
      record.updatedAt = new Date().toISOString();
      return ok(record, 'Profile saved.');
    },

    async listAuditLogs(query: AuditQuery = {}) {
      await sleep(LATENCY.list);
      if (!actor) return unauthenticated<PagedResult<AuditLogRecord>>();
      let records = visibleAudit();
      if (query.domain) records = records.filter((item) => item.domain === query.domain);
      if (query.eventType) records = records.filter((item) => item.eventType === query.eventType);
      // The backend accepts `search` but never applies it (finding F-12), so the mock
      // filters client-side and the UI labels the field accordingly.
      const filtered = records
        .filter((item) => matches([item.details, item.actor, item.organization, item.action, item.targetResourceId], query.search))
        .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
      return ok(paginate(filtered, query.page, query.limit ?? 25));
    },

    async checkHealth() {
      await sleep(LATENCY.detail);
      return ok({
        status: 'ok' as const,
        service: 'credlink-api (not connected in this preview)',
        database: 'connected' as const,
        timestamp: new Date().toISOString(),
      });
    },
  };
}
function pickClaims(
  record: { claims: CredentialRecord['claims'] },
  approved: string[],
): Record<string, unknown> {
  const source: Record<string, unknown> = Array.isArray(record.claims) ? {} : record.claims;
  const output: Record<string, unknown> = {};
  for (const key of approved) {
    if (Object.prototype.hasOwnProperty.call(source, key)) output[key] = source[key];
  }
  return output;
}

function evaluateLifecycle(record: { status: CredentialRecord['status']; expirationDate: string | null; issuanceDate: string }, now: Date) {
  const isRevoked = record.status === 'REVOKED';
  const isExpired =
    record.status === 'EXPIRED' ||
    Boolean(record.expirationDate && new Date(record.expirationDate).getTime() < now.getTime());
  return {
    status: (isExpired ? 'EXPIRED' : record.status) as CredentialRecord['status'],
    isRevoked,
    isExpired,
    issuanceDate: record.issuanceDate,
    expirationDate: record.expirationDate,
  };
}
/**
 * Live DataClient — the production transport behind the `createDataClient` seam.
 *
 * Every call goes to a same-origin Next.js route handler. The route handler holds
 * the HttpOnly session cookie and attaches the Bearer token server-side, so this
 * client never sees or stores a token. Response envelopes are unwrapped and the
 * backend's exact field names are adapted here (see `lib/data/normalize.ts`).
 *
 * Business failures return `{ success: false, error, details }`. Network outages
 * and 503s throw `TransportError`, matching the mock client's two failure channels.
 */

import { TransportError } from '@/lib/data/mock-client';
import type {
  AuditQuery,
  ConsentQuery,
  CreateOrganizationInput,
  CredentialQuery,
  DataClient,
  IssueCredentialInput,
  OrganizationQuery,
  PagedResult,
  RegisterInput,
  RegisterResult,
  SignInInput,
  SignInResult,
  TrustQuery,
  VerifyInput,
} from '@/lib/data/types';
import {
  normalizeAuditLog,
  normalizeCitizen,
  normalizeConsent,
  normalizeCredential,
  normalizeOrganization,
  normalizeProfile,
  normalizeSharedAccess,
  normalizeTrustEntry,
  normalizeUser,
  normalizeVerification,
  pagedResult,
} from '@/lib/data/normalize';
import type {
  ApiResponse,
  AuditLogRecord,
  AuthUserRecord,
  CitizenSummary,
  ConsentRecord,
  CredentialRecord,
  OrganizationMembership,
  OrganizationSummary,
  ProfileRecord,
  SharedAccessResult,
  TrustRegistryEntry,
  VerificationCheck,
} from '@/lib/types';

export const SESSION_EXPIRED_EVENT = 'credlink:session-expired';

let liveActor: { organizationId: string | null } | null = null;

/** The provider keeps the current organization context here so institution-scoped
 *  writes (issuance, consent requests, shared access) can supply the org the backend
 *  requires without every screen having to thread it through. */
export function setLiveActor(actor: { organizationId: string | null } | null): void {
  liveActor = actor;
}

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.split('; ').find((part) => part.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : null;
}

function notifySessionExpired(): void {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
}

function toQuery(params: Record<string, unknown>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;
    search.set(key, String(value));
  }
  const serialized = search.toString();
  return serialized ? `?${serialized}` : '';
}

interface FetchOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  sessionAware?: boolean;
}

async function apiFetch<T>(path: string, options: FetchOptions = {}): Promise<ApiResponse<T>> {
  const method = options.method ?? 'GET';
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (options.body !== undefined) headers['Content-Type'] = 'application/json';
  if (method !== 'GET') {
    const csrf = readCookie('cl_csrf');
    if (csrf) headers['X-CSRF-Token'] = csrf;
  }

  let response: Response;
  try {
    response = await fetch(path, {
      method,
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      credentials: 'same-origin',
      cache: 'no-store',
    });
  } catch {
    throw new TransportError();
  }

  if (response.status === 503) throw new TransportError();

  let payload: Record<string, unknown> | null = null;
  try {
    payload = (await response.json()) as Record<string, unknown>;
  } catch {
    payload = null;
  }

  if (response.status === 401 && options.sessionAware !== false) notifySessionExpired();

  if (payload && typeof payload.success === 'boolean') {
    return {
      success: Boolean(payload.success),
      message: typeof payload.message === 'string' ? payload.message : undefined,
      data: payload.data as T,
      error: typeof payload.error === 'string' ? payload.error : undefined,
      details: Array.isArray(payload.details) ? (payload.details as { field: string; message: string }[]) : undefined,
      timestamp: typeof payload.timestamp === 'string' ? payload.timestamp : new Date().toISOString(),
    };
  }

  return { success: false, error: 'Unexpected response from the service.', timestamp: new Date().toISOString() };
}

function remap<T>(response: ApiResponse<unknown>, mapper: (raw: any) => T): ApiResponse<T> {
  if (!response.success || response.data === undefined) return response as ApiResponse<T>;
  return { ...response, data: mapper(response.data) };
}

function contains(haystack: (string | null | undefined)[], needle?: string): boolean {
  if (!needle || needle.trim().length === 0) return true;
  const lower = needle.trim().toLowerCase();
  return haystack.some((value) => (value ?? '').toLowerCase().includes(lower));
}

export function createLiveDataClient(): DataClient {
  return {
    mode: 'live',

    async signIn(input: SignInInput): Promise<ApiResponse<SignInResult>> {
      if (input.simulateOffline) throw new TransportError();
      const response = await apiFetch<{ user: AuthUserRecord; memberships: OrganizationMembership[] }>('/api/auth/login', {
        method: 'POST',
        body: { email: input.email, password: input.password },
        sessionAware: false,
      });
      if (!response.success || !response.data) return response as ApiResponse<SignInResult>;
      return {
        ...response,
        data: { user: response.data.user, memberships: response.data.memberships, session: null, mode: 'live' },
      };
    },

    async register(input: RegisterInput): Promise<ApiResponse<RegisterResult>> {
      return apiFetch<RegisterResult>('/api/auth/register', {
        method: 'POST',
        body: {
          email: input.email,
          password: input.password,
          fullName: input.fullName,
          phone: input.phone,
          role: input.requestedRole,
        },
        sessionAware: false,
      });
    },

    getMe() {
      return apiFetch<{ user: AuthUserRecord; memberships: OrganizationMembership[] }>('/api/auth/me', { sessionAware: false });
    },

    // -- Credentials --------------------------------------------------------
    async listCredentials(query: CredentialQuery = {}) {
      const page = query.page ?? 1;
      const limit = query.limit ?? 10;
      const response = await apiFetch<unknown>(
        `/api/proxy/credentials${toQuery({
          page,
          limit,
          domain: query.domain,
          status: query.status,
          subjectId: query.subjectId,
          issuerOrgId: query.issuerOrgId,
        })}`,
      );
      if (!response.success || response.data === undefined) return response as ApiResponse<PagedResult<CredentialRecord>>;
      const result = pagedResult(response.data as Record<string, unknown>, normalizeCredential, { page, limit });
      if (query.search) {
        result.items = result.items.filter((item) =>
          contains([item.title, item.credentialType, item.subjectName, item.issuer?.name, item.id], query.search),
        );
      }
      return { ...response, data: result };
    },

    async getCredential(id: string) {
      return remap(await apiFetch<unknown>(`/api/proxy/credentials/${encodeURIComponent(id)}`), normalizeCredential);
    },

    async issueCredential(input: IssueCredentialInput) {
      const body: Record<string, unknown> = {
        subjectId: input.subjectId,
        issuerOrgId: input.issuerOrgId ?? liveActor?.organizationId ?? undefined,
        domain: input.domain,
        credentialType: input.credentialType,
        title: input.title,
        claims: input.claims,
        expirationDate: input.expiresAt ?? null,
      };
      Object.keys(body).forEach((key) => body[key] === undefined && delete body[key]);
      return remap(await apiFetch<unknown>('/api/proxy/credentials', { method: 'POST', body }), normalizeCredential);
    },

    async revokeCredential(id: string, reason: string) {
      return remap(
        await apiFetch<unknown>(`/api/proxy/credentials/${encodeURIComponent(id)}/revoke`, { method: 'POST', body: { reason } }),
        normalizeCredential,
      );
    },

    // -- Consents -----------------------------------------------------------
    async listConsents(query: ConsentQuery = {}) {
      const page = query.page ?? 1;
      const limit = query.limit ?? 10;
      const response = await apiFetch<unknown>(
        `/api/proxy/consents${toQuery({
          page,
          limit,
          status: query.status,
          domain: query.domain,
          citizenId: query.citizenId,
          requestingOrgId: query.requestingOrgId,
        })}`,
      );
      if (!response.success || response.data === undefined) return response as ApiResponse<PagedResult<ConsentRecord>>;
      const result = pagedResult(response.data as Record<string, unknown>, normalizeConsent, { page, limit });
      if (query.credentialId) result.items = result.items.filter((item) => item.credentialId === query.credentialId);
      if (query.search) {
        result.items = result.items.filter((item) =>
          contains([item.purpose, item.citizenName, item.requestingOrg?.name, item.credential?.title, item.id], query.search),
        );
      }
      return { ...response, data: result };
    },

    async getConsent(id: string) {
      return remap(await apiFetch<unknown>(`/api/proxy/consents/${encodeURIComponent(id)}`), normalizeConsent);
    },

    async requestConsent(input) {
      const body: Record<string, unknown> = {
        citizenId: input.citizenId,
        requestingOrgId: input.requestingOrgId ?? liveActor?.organizationId ?? undefined,
        credentialId: input.credentialId || null,
        purpose: input.purpose,
        requestedClaims: input.requestedClaims,
        expiresAt: input.expiresAt ?? null,
      };
      Object.keys(body).forEach((key) => body[key] === undefined && delete body[key]);
      return remap(await apiFetch<unknown>('/api/proxy/consents/request', { method: 'POST', body }), normalizeConsent);
    },

    async respondConsent(id: string, decision) {
      return remap(
        await apiFetch<unknown>(`/api/proxy/consents/${encodeURIComponent(id)}/respond`, { method: 'POST', body: decision }),
        normalizeConsent,
      );
    },

    async revokeConsent(id: string) {
      return remap(await apiFetch<unknown>(`/api/proxy/consents/${encodeURIComponent(id)}/revoke`, { method: 'POST' }), normalizeConsent);
    },

    async accessSharedCredential(input: { credentialId: string }) {
      const body = {
        credentialId: input.credentialId,
        requestingOrgId: liveActor?.organizationId ?? undefined,
      };
      return remap(
        await apiFetch<unknown>('/api/proxy/consents/share-access', { method: 'POST', body }),
        (raw) => normalizeSharedAccess(raw as Record<string, unknown>, liveActor?.organizationId ?? ''),
      );
    },

    async verifyCredential(input: VerifyInput) {
      const body: Record<string, unknown> = {
        credentialId: input.credentialId,
        consentId: input.consentId,
        verifierOrgId: input.verifierOrgId ?? liveActor?.organizationId ?? undefined,
      };
      Object.keys(body).forEach((key) => body[key] === undefined && delete body[key]);
      return remap(await apiFetch<unknown>('/api/proxy/verification/verify-credential', { method: 'POST', body }), normalizeVerification);
    },

    // -- Organizations ------------------------------------------------------
    async listOrganizations(query: OrganizationQuery = {}) {
      const page = query.page ?? 1;
      const limit = query.limit ?? 10;
      const response = await apiFetch<unknown>(`/api/proxy/organizations${toQuery({ page, limit })}`);
      if (!response.success || response.data === undefined) return response as ApiResponse<PagedResult<OrganizationSummary>>;
      const result = pagedResult(response.data as Record<string, unknown>, normalizeOrganization, { page, limit });
      if (query.verificationStatus) {
        result.items = result.items.filter((item) => item.verificationStatus === query.verificationStatus);
      }
      if (query.domain) result.items = result.items.filter((item) => item.domain === query.domain);
      if (query.search) result.items = result.items.filter((item) => contains([item.name, item.code, item.did], query.search));
      return { ...response, data: result };
    },

    async getOrganization(id: string) {
      return remap(await apiFetch<unknown>(`/api/proxy/organizations/${encodeURIComponent(id)}`), normalizeOrganization);
    },

    async createOrganization(input: CreateOrganizationInput) {
      return remap(
        await apiFetch<unknown>('/api/proxy/organizations', {
          method: 'POST',
          body: { name: input.name, code: input.code, domain: input.domain, registrationRef: input.registrationRef },
        }),
        normalizeOrganization,
      );
    },

    async updateOrganizationStatus(id, input) {
      return remap(
        await apiFetch<unknown>(`/api/proxy/organizations/${encodeURIComponent(id)}/status`, { method: 'PATCH', body: input }),
        normalizeOrganization,
      );
    },

    // -- Trust registry -----------------------------------------------------
    async listTrustRegistry(query: TrustQuery = {}) {
      const page = query.page ?? 1;
      const limit = query.limit ?? 10;
      const response = await apiFetch<unknown>(
        `/api/proxy/trust-registry${toQuery({ page, limit, trustStatus: query.trustStatus })}`,
      );
      if (!response.success || response.data === undefined) return response as ApiResponse<PagedResult<TrustRegistryEntry>>;
      const result = pagedResult(response.data as Record<string, unknown>, normalizeTrustEntry, { page, limit });
      if (query.search) {
        result.items = result.items.filter((item) =>
          contains([item.issuerIdentifier, item.organization?.name, item.organization?.code], query.search),
        );
      }
      return { ...response, data: result };
    },

    async getTrustEntry(orgIdOrDid: string) {
      return remap(await apiFetch<unknown>(`/api/proxy/trust-registry/${encodeURIComponent(orgIdOrDid)}`), normalizeTrustEntry);
    },

    async registerTrustIssuer(input) {
      return remap(
        await apiFetch<unknown>('/api/proxy/trust-registry/register', {
          method: 'POST',
          body: { organizationId: input.organizationId, verificationMetadata: input.verificationMetadata ?? {} },
        }),
        normalizeTrustEntry,
      );
    },

    async updateTrustStatus(id: string, input) {
      return remap(
        await apiFetch<unknown>(`/api/proxy/trust-registry/${encodeURIComponent(id)}/status`, { method: 'PATCH', body: input }),
        normalizeTrustEntry,
      );
    },

    // -- Profile and directory ---------------------------------------------
    async listCitizens() {
      return remap(await apiFetch<unknown[]>('/api/proxy/profiles/citizens'), (raw) =>
        Array.isArray(raw) ? raw.map(normalizeCitizen) : [],
      ) as ApiResponse<CitizenSummary[]>;
    },

    async getProfile() {
      return remap(await apiFetch<unknown>('/api/proxy/profiles/me'), normalizeProfile);
    },

    async updateProfile(input: { fullName?: string; phone?: string }) {
      return remap(await apiFetch<unknown>('/api/proxy/profiles/me', { method: 'PATCH', body: input }), normalizeProfile);
    },

    // -- Audit --------------------------------------------------------------
    async listAuditLogs(query: AuditQuery = {}) {
      const page = query.page ?? 1;
      const limit = query.limit ?? 25;
      const response = await apiFetch<unknown>(
        `/api/proxy/audit-logs${toQuery({ page, limit, domain: query.domain, eventType: query.eventType })}`,
      );
      if (!response.success || response.data === undefined) return response as ApiResponse<PagedResult<AuditLogRecord>>;
      const result = pagedResult(response.data as Record<string, unknown>, normalizeAuditLog, { page, limit });
      if (query.search) {
        result.items = result.items.filter((item) =>
          contains([item.details, item.actor, item.organization, item.action, item.targetResourceId], query.search),
        );
      }
      return { ...response, data: result };
    },

    // -- Health -------------------------------------------------------------
    async checkHealth() {
      let response: Response;
      try {
        response = await fetch('/api/health', { cache: 'no-store', headers: { Accept: 'application/json' } });
      } catch {
        throw new TransportError();
      }
      const raw = (await response.json().catch(() => null)) as Record<string, any> | null;
      const databaseStatus = raw?.database?.status;
      return {
        success: true,
        data: {
          status: raw?.status === 'degraded' ? 'degraded' : 'ok',
          service: typeof raw?.service === 'string' ? raw.service : 'credlink-backend',
          database: databaseStatus === 'connected' ? 'connected' : 'unavailable',
          timestamp: typeof raw?.timestamp === 'string' ? raw.timestamp : new Date().toISOString(),
        },
        timestamp: new Date().toISOString(),
      };
    },
  };
}

export { normalizeUser };
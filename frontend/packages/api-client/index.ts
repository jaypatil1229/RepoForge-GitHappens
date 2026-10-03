// CredLink Typed API Client Package
// Connects frontend applications to CredLink Express REST API backend

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  details?: unknown;
  timestamp: string;
}

export interface AuthUserRecord {
  id: string;
  email: string;
  fullName: string;
  phone?: string | null;
  role: string;
  status: 'ACTIVE' | 'SUSPENDED';
  organizationId?: string | null;
  organizationName?: string;
  organizationCode?: string | null;
  organizationDomain?: string | null;
  organizationDid?: string;
  organizationStatus?: string | null;
  isIssuer?: boolean;
  authorizedCredentialTypes?: string[];
  createdAt?: string;
}

export interface CitizenSummary {
  id: string;
  fullName: string;
  email: string;
  phone?: string | null;
  role: string;
  accountStatus: string;
  createdAt?: string;
}

export interface AuthSession {
  access_token: string;
  refresh_token: string;
  expires_at?: number;
}

export interface OrganizationSummary {
  id: string;
  name: string;
  code: string;
  domain: string;
  did: string;
  is_issuer?: boolean;
  isIssuer?: boolean;
  verification_status?: 'PENDING' | 'APPROVED' | 'SUSPENDED' | 'REJECTED';
  status?: string;
  authorized_credential_types?: string[];
  authorizedCredentialTypes?: string[];
  createdAt?: string;
}

export interface OrganizationMembership {
  id: string;
  member_role: 'ADMIN' | 'ISSUER' | 'VERIFIER' | 'MEMBER';
  status: 'ACTIVE' | 'SUSPENDED';
  organization: OrganizationSummary;
}

export interface LoginResponseData {
  user: AuthUserRecord;
  session: AuthSession;
  memberships: OrganizationMembership[];
}

export interface MeResponseData {
  user: AuthUserRecord;
  memberships: OrganizationMembership[];
}

export interface RegisterInput {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  role?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export class ApiClientError extends Error {
  public statusCode: number;
  public details?: unknown;

  constructor(message: string, statusCode: number = 500, details?: unknown) {
    super(message);
    this.name = 'ApiClientError';
    this.statusCode = statusCode;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export interface TrustRegistryEntry {
  id: string;
  organizationId: string;
  issuerIdentifier: string;
  organization?: OrganizationSummary | null;
  trustStatus: 'VERIFIED' | 'SUSPENDED' | 'REVOKED' | 'UNREGISTERED';
  verificationMetadata?: Record<string, unknown>;
  lastVerifiedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface CredentialRecord {
  id: string;
  subjectId: string;
  subjectName?: string;
  issuerOrgId: string;
  issuer?: { id: string; name: string; did: string } | null;
  domain: string;
  credentialType: string;
  title: string;
  claims: Record<string, unknown> | Array<{ key: string; label: string; value: string }>;
  issuanceDate: string;
  expirationDate?: string | null;
  status: 'VALID' | 'REVOKED' | 'EXPIRED';
  revocationReason?: string | null;
  revokedAt?: string | null;
  issuerSignature?: string;
  qrPayload?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface VerificationCheckResult {
  verified: boolean;
  verificationResult: 'APPROVED' | 'REJECTED';
  credentialSummary?: {
    id: string;
    subjectId: string;
    domain: string;
    credentialType: string;
    title: string;
    status: string;
  };
  trustRegistryCheck?: {
    issuerDid: string;
    issuerName: string;
    issuerOrgApproved: boolean;
    trustStatus: string;
    isTrusted: boolean;
    lastVerifiedAt: string | null;
  };
  lifecycleCheck?: {
    status: string;
    isRevoked: boolean;
    isExpired: boolean;
    expirationDate: string | null;
  };
  cryptographicCheck?: {
    signatureValid: boolean;
    algorithm: string;
    verifiedAt: string;
  };
}

export class CredLinkApiClient {
  private baseUrl: string;
  private authToken: string | null = null;
  private refreshToken: string | null = null;
  private isRefreshing: boolean = false;

  constructor(baseUrl?: string) {
    const PROD_BACKEND =
      (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_BACKEND_PRODUCTION_URL) ||
      'https://credlink-20-production.up.railway.app';

    if (baseUrl) {
      this.baseUrl = baseUrl;
    } else if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      const envUrl = typeof process !== 'undefined' && process.env.NEXT_PUBLIC_API_URL;
      const isInvalidProdBackend =
        !envUrl ||
        envUrl.includes('localhost') ||
        envUrl.includes('127.0.0.1') ||
        envUrl.includes('vercel.app');
      this.baseUrl = isInvalidProdBackend ? PROD_BACKEND : envUrl;
    } else {
      this.baseUrl = (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_API_URL) || 'http://localhost:5000';
    }
    // Remove trailing slash if present
    if (this.baseUrl.endsWith('/')) {
      this.baseUrl = this.baseUrl.slice(0, -1);
    }
  }

  /**
   * Set or clear Bearer authentication token for subsequent API requests.
   */
  public setToken(token: string | null): void {
    this.authToken = token;
  }

  /**
   * Get currently active Bearer authentication token (with localStorage fallback).
   */
  public getToken(): string | null {
    if (!this.authToken && typeof window !== 'undefined') {
      const stored = localStorage.getItem('credlink_auth_token');
      if (stored) {
        this.authToken = stored;
      }
    }
    return this.authToken;
  }

  /**
   * Set or clear refresh token.
   */
  public setRefreshToken(token: string | null): void {
    this.refreshToken = token;
  }

  /**
   * Get currently active refresh token (with localStorage fallback).
   */
  public getRefreshToken(): string | null {
    if (!this.refreshToken && typeof window !== 'undefined') {
      const stored = localStorage.getItem('credlink_refresh_token');
      if (stored) {
        this.refreshToken = stored;
      }
    }
    return this.refreshToken;
  }

  /**
   * Set dynamic API base URL.
   */
  public setBaseUrl(url: string): void {
    let cleanUrl = url;
    if (cleanUrl.endsWith('/')) {
      cleanUrl = cleanUrl.slice(0, -1);
    }
    this.baseUrl = cleanUrl;
  }

  /**
   * Refreshes user session using stored or provided refresh token.
   */
  public async refreshSession(refreshTokenOverride?: string): Promise<ApiResponse<LoginResponseData>> {
    const rfToken = refreshTokenOverride || this.getRefreshToken();
    if (!rfToken) {
      throw new ApiClientError('No refresh token available', 401);
    }

    const response = await this.request<LoginResponseData>('/api/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken: rfToken }),
    }, false);

    if (response.data?.session?.access_token) {
      this.setToken(response.data.session.access_token);
      if (typeof window !== 'undefined') {
        localStorage.setItem('credlink_auth_token', response.data.session.access_token);
      }
    }
    if (response.data?.session?.refresh_token) {
      this.setRefreshToken(response.data.session.refresh_token);
      if (typeof window !== 'undefined') {
        localStorage.setItem('credlink_refresh_token', response.data.session.refresh_token);
      }
    }

    return response;
  }

  /**
   * Helper method for executing HTTP fetch requests with standard headers, error handling, auto-refresh, and JSON parsing.
   */
  private async request<T>(path: string, options: RequestInit = {}, allowRefresh: boolean = true): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
    const activeToken = this.getToken();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    if (activeToken && !headers['Authorization']) {
      headers['Authorization'] = `Bearer ${activeToken}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      let jsonBody: ApiResponse<T>;
      try {
        jsonBody = await response.json();
      } catch (jsonErr) {
        throw new ApiClientError(
          `Invalid JSON response received from server (${response.status} ${response.statusText}) at ${url}`,
          response.status
        );
      }

      // Check for 401 token invalid / expired error and attempt auto-refresh
      const isAuthError = response.status === 401 || (jsonBody.error && jsonBody.error.toLowerCase().includes('token'));
      if (isAuthError && allowRefresh && !this.isRefreshing && !path.includes('/auth/login') && !path.includes('/auth/refresh')) {
        const rfToken = this.getRefreshToken();
        if (rfToken) {
          try {
            this.isRefreshing = true;
            await this.refreshSession(rfToken);
            this.isRefreshing = false;
            // Retry the original request once with fresh token
            return await this.request<T>(path, options, false);
          } catch {
            this.isRefreshing = false;
            this.setToken(null);
            this.setRefreshToken(null);
            if (typeof window !== 'undefined') {
              localStorage.removeItem('credlink_auth_token');
              localStorage.removeItem('credlink_refresh_token');
            }
          }
        }
      }

      if (!response.ok || jsonBody.success === false) {
        let errorMessage = jsonBody.error || jsonBody.message || `Request failed with status ${response.status}`;
        if (jsonBody.details && Array.isArray(jsonBody.details) && jsonBody.details.length > 0) {
          const detailStrings = jsonBody.details.map((d: any) =>
            d.field && d.message ? `${d.field}: ${d.message}` : (d.message || JSON.stringify(d))
          );
          const detailJoined = detailStrings.join(', ');
          if (!errorMessage.includes(detailJoined)) {
            errorMessage = `${errorMessage} (${detailJoined})`;
          }
        }
        throw new ApiClientError(errorMessage, response.status, jsonBody.details);
      }

      return jsonBody;
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        throw err;
      }
      if (err instanceof Error) {
        if (err.name === 'AbortError') {
          throw new ApiClientError('Request aborted by client', 499);
        }
        throw new ApiClientError(`Network connection error: ${err.message}`, 503);
      }
      throw new ApiClientError('An unknown network error occurred', 500);
    }
  }

  /**
   * POST /api/auth/login - Authenticate user credentials and return user, session token, and organization memberships.
   */
  public async login(credentials: LoginInput): Promise<ApiResponse<LoginResponseData>> {
    const response = await this.request<LoginResponseData>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }, false);

    if (response.data?.session?.access_token) {
      this.setToken(response.data.session.access_token);
      if (typeof window !== 'undefined') {
        localStorage.setItem('credlink_auth_token', response.data.session.access_token);
      }
    }
    if (response.data?.session?.refresh_token) {
      this.setRefreshToken(response.data.session.refresh_token);
      if (typeof window !== 'undefined') {
        localStorage.setItem('credlink_refresh_token', response.data.session.refresh_token);
      }
    }

    return response;
  }

  /**
   * GET /api/auth/me - Retrieve profile and organization memberships for current authenticated user.
   */
  public async getMe(tokenOverride?: string): Promise<ApiResponse<MeResponseData>> {
    const headers: Record<string, string> = {};
    if (tokenOverride) {
      headers['Authorization'] = `Bearer ${tokenOverride}`;
    }

    return this.request<MeResponseData>('/api/auth/me', {
      method: 'GET',
      headers,
    });
  }

  /**
   * POST /api/auth/register - Register a new citizen or organization user account.
   */
  public async register(input: RegisterInput): Promise<ApiResponse<LoginResponseData>> {
    const response = await this.request<LoginResponseData>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(input),
    }, false);

    if (response.data?.session?.access_token) {
      this.setToken(response.data.session.access_token);
      if (typeof window !== 'undefined') {
        localStorage.setItem('credlink_auth_token', response.data.session.access_token);
      }
    }
    if (response.data?.session?.refresh_token) {
      this.setRefreshToken(response.data.session.refresh_token);
      if (typeof window !== 'undefined') {
        localStorage.setItem('credlink_refresh_token', response.data.session.refresh_token);
      }
    }

    return response;
  }

  /**
   * POST /api/auth/logout - Invalidate current user session on backend and clear local token.
   */
  public async logout(tokenOverride?: string): Promise<ApiResponse<null>> {
    const headers: Record<string, string> = {};
    if (tokenOverride) {
      headers['Authorization'] = `Bearer ${tokenOverride}`;
    }

    try {
      const response = await this.request<null>('/api/auth/logout', {
        method: 'POST',
        headers,
      }, false);
      return response;
    } finally {
      this.setToken(null);
      this.setRefreshToken(null);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('credlink_auth_token');
        localStorage.removeItem('credlink_refresh_token');
      }
    }
  }

  /**
   * GET /api/health - Check backend API and database connectivity status.
   */
  public async checkHealth(): Promise<ApiResponse<unknown>> {
    return this.request<unknown>('/api/health', { method: 'GET' });
  }

  /**
   * GET /api/organizations - Fetch organizations list with optional filtering
   */
  public async listOrganizations(query?: { page?: number; limit?: number; domain?: string }): Promise<ApiResponse<{ organizations: OrganizationSummary[]; pagination: unknown }>> {
    const params = new URLSearchParams();
    if (query?.page) params.append('page', query.page.toString());
    if (query?.limit) params.append('limit', query.limit.toString());
    if (query?.domain) params.append('domain', query.domain);
    const queryString = params.toString() ? `?${params.toString()}` : '';
    return this.request<{ organizations: OrganizationSummary[]; pagination: unknown }>(`/api/organizations${queryString}`, { method: 'GET' });
  }

  /**
   * GET /api/organizations/:id - Get single organization by ID
   */
  public async getOrganization(id: string): Promise<ApiResponse<OrganizationSummary>> {
    return this.request<OrganizationSummary>(`/api/organizations/${id}`, { method: 'GET' });
  }

  /**
   * POST /api/organizations - Create a new organization (auto-adds creator as org ADMIN member)
   */
  public async createOrganization(input: { name: string; code: string; domain: string; registrationRef?: string }): Promise<ApiResponse<OrganizationSummary>> {
    return this.request<OrganizationSummary>('/api/organizations', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  /**
   * GET /api/trust-registry - Fetch trust registry entries
   */
  public async listTrustRegistry(query?: { page?: number; limit?: number; trustStatus?: string; domain?: string }): Promise<ApiResponse<{ entries: TrustRegistryEntry[]; pagination: unknown }>> {
    const params = new URLSearchParams();
    if (query?.page) params.append('page', query.page.toString());
    if (query?.limit) params.append('limit', query.limit.toString());
    if (query?.trustStatus) params.append('trustStatus', query.trustStatus);
    if (query?.domain) params.append('domain', query.domain);
    const queryString = params.toString() ? `?${params.toString()}` : '';
    return this.request<{ entries: TrustRegistryEntry[]; pagination: unknown }>(`/api/trust-registry${queryString}`, { method: 'GET' });
  }

  /**
   * POST /api/trust-registry/register - Admin register issuer in trust registry
   */
  public async registerTrustIssuer(input: { organizationId: string; trustStatus?: string; verificationMetadata?: unknown }): Promise<ApiResponse<TrustRegistryEntry>> {
    return this.request<TrustRegistryEntry>('/api/trust-registry/register', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  /**
   * PATCH /api/trust-registry/:id/status - Admin update issuer trust status
   */
  public async updateTrustStatus(id: string, input: { trustStatus: string; reason?: string }): Promise<ApiResponse<TrustRegistryEntry>> {
    return this.request<TrustRegistryEntry>(`/api/trust-registry/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    });
  }

  /**
   * POST /api/verification/verify-credential - Comprehensive multi-layer credential check
   */
  public async verifyCredentialComprehensive(input: { credentialId?: string; credentialPayload?: unknown }): Promise<ApiResponse<VerificationCheckResult>> {
    return this.request<VerificationCheckResult>('/api/verification/verify-credential', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  /**
   * GET /api/credentials - Fetch credentials list for authorized user/organization
   */
  public async listCredentials(query?: { page?: number; limit?: number; domain?: string; status?: string; subjectId?: string; issuerOrgId?: string }): Promise<ApiResponse<{ credentials: CredentialRecord[]; pagination: unknown }>> {
    const params = new URLSearchParams();
    if (query?.page) params.append('page', query.page.toString());
    if (query?.limit) params.append('limit', query.limit.toString());
    if (query?.domain) params.append('domain', query.domain);
    if (query?.status) params.append('status', query.status);
    if (query?.subjectId) params.append('subjectId', query.subjectId);
    if (query?.issuerOrgId) params.append('issuerOrgId', query.issuerOrgId);
    const queryString = params.toString() ? `?${params.toString()}` : '';
    return this.request<{ credentials: CredentialRecord[]; pagination: unknown }>(`/api/credentials${queryString}`, { method: 'GET' });
  }

  /**
   * POST /api/credentials - Issue a credential for authorized organization issuer
   */
  public async issueCredential(payload: Record<string, unknown>): Promise<ApiResponse<CredentialRecord>> {
    return this.request<CredentialRecord>('/api/credentials', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  /**
   * POST /api/credentials/:id/revoke - Revoke a credential
   */
  public async revokeCredential(id: string, reason?: string): Promise<ApiResponse<CredentialRecord>> {
    return this.request<CredentialRecord>(`/api/credentials/${id}/revoke`, {
      method: 'POST',
      body: JSON.stringify({ reason: reason || 'Revoked by authorized issuer' }),
    });
  }

  /**
   * GET /api/consents - Fetch consents / verification requests list
   */
  public async listConsents(query?: { page?: number; limit?: number; status?: string; type?: string }): Promise<ApiResponse<{ consents: unknown[]; pagination: unknown }>> {
    const params = new URLSearchParams();
    if (query?.page) params.append('page', query.page.toString());
    if (query?.limit) params.append('limit', query.limit.toString());
    if (query?.status) params.append('status', query.status);
    if (query?.type) params.append('type', query.type);
    const queryString = params.toString() ? `?${params.toString()}` : '';
    return this.request<{ consents: unknown[]; pagination: unknown }>(`/api/consents${queryString}`, { method: 'GET' });
  }

  /**
   * POST /api/consents/request - Create a consent / verification request
   */
  public async createConsentRequest(payload: {
    citizenId: string;
    requestingOrgId: string;
    purpose: string;
    requestedClaims: string[];
    domain?: string;
    credentialId?: string;
    expiresInDays?: number;
  }): Promise<ApiResponse<unknown>> {
    return this.request<unknown>('/api/consents/request', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  /**
   * POST /api/consents/:id/respond - Citizen approves or denies a consent request
   */
  public async respondConsent(
    id: string,
    action: 'APPROVE' | 'DENY',
    approvedClaims?: string[]
  ): Promise<ApiResponse<unknown>> {
    return this.request<unknown>(`/api/consents/${id}/respond`, {
      method: 'POST',
      body: JSON.stringify({ action, approvedClaims }),
    });
  }

  /**
   * POST /api/presentations/requests/:id/respond - Citizen approves and presents or rejects a presentation request
   */
  public async respondPresentationRequest(
    id: string,
    action: 'APPROVE' | 'DENY',
    approvedClaims?: string[]
  ): Promise<ApiResponse<unknown>> {
    return this.request<unknown>(`/api/presentations/requests/${id}/respond`, {
      method: 'POST',
      body: JSON.stringify({ action, approvedClaims }),
    });
  }

  /**
   * POST /api/consents/:id/revoke - Citizen revokes an existing approved consent
   */
  public async revokeConsent(id: string): Promise<ApiResponse<unknown>> {
    return this.request<unknown>(`/api/consents/${id}/revoke`, {
      method: 'POST',
    });
  }

  /**
   * PATCH /api/organizations/:id/status - Update organization verification status
   */
  public async updateOrganizationStatus(
    id: string,
    payload: { verificationStatus: 'PENDING' | 'APPROVED' | 'DENIED'; isIssuer?: boolean; authorizedCredentialTypes?: string[] }
  ): Promise<ApiResponse<OrganizationSummary>> {
    return this.request<OrganizationSummary>(`/api/organizations/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  }

  /**
   * GET /api/audit-logs - Query audit log events
   */
  public async listAuditLogs(query?: {
    page?: number;
    limit?: number;
    domain?: string;
    eventType?: string;
    search?: string;
  }): Promise<ApiResponse<{ logs: any[]; pagination: unknown }>> {
    const params = new URLSearchParams();
    if (query?.page) params.append('page', query.page.toString());
    if (query?.limit) params.append('limit', query.limit.toString());
    if (query?.domain) params.append('domain', query.domain);
    if (query?.eventType) params.append('eventType', query.eventType);
    if (query?.search) params.append('search', query.search);
    const queryString = params.toString() ? `?${params.toString()}` : '';
    return this.request<{ logs: any[]; pagination: unknown }>(`/api/audit-logs${queryString}`, { method: 'GET' });
  }

  /**
   * GET /api/profiles/citizens - Retrieve active citizen profiles for credential issuance and verification requests
   */
  public async getCitizens(): Promise<ApiResponse<CitizenSummary[]>> {
    return this.request<CitizenSummary[]>('/api/profiles/citizens', { method: 'GET' });
  }

  public async verifyRequest(requestId: string): Promise<{ status: string }> {
    const response = await this.verifyCredentialComprehensive({ credentialId: requestId });
    return { status: response.data?.verificationResult || 'APPROVED' };
  }

  /**
   * GET /api/demo/dashboard - Public read-only demo data endpoint (no auth required).
   * Returns credentials, organizations, trust registry, audit logs, and consents from Supabase.
   */
  public async fetchDemoData(): Promise<ApiResponse<any>> {
    return this.request<any>('/api/demo/dashboard', { method: 'GET' });
  }

  // ── QR Code Operations ────────────────────────────────────────────────

  /**
   * POST /api/qr/consent/:id/generate - Generate QR code for a consent request
   */
  public async generateConsentQr(consentId: string): Promise<ApiResponse<{ qrDataUrl: string; payload: unknown }>> {
    return this.request<{ qrDataUrl: string; payload: unknown }>(`/api/qr/consent/${consentId}/generate`, {
      method: 'POST',
    });
  }

  /**
   * POST /api/qr/credential/:id/generate - Generate QR code for a credential
   */
  public async generateCredentialQr(credentialId: string): Promise<ApiResponse<{ qrDataUrl: string; payload: unknown }>> {
    return this.request<{ qrDataUrl: string; payload: unknown }>(`/api/qr/credential/${credentialId}/generate`, {
      method: 'POST',
    });
  }

  /**
   * POST /api/qr/resolve - Resolve a scanned QR payload string
   */
  public async resolveQrPayload(payload: string): Promise<ApiResponse<{
    qrType: 'consent_request' | 'credential';
    id: string;
    status?: string;
    alreadyProcessed?: boolean;
    requestingOrg?: { id: string; name: string; code: string; domain?: string } | null;
    credential?: { id: string; title: string; credentialType: string; status: string } | null;
    domain?: string;
    purpose?: string;
    requestedClaims?: string[];
    expiresAt?: string | null;
    createdAt?: string;
  }>> {
    return this.request(`/api/qr/resolve`, {
      method: 'POST',
      body: JSON.stringify({ payload }),
    });
  }
}

export const createApiClient = (baseUrl?: string) => new CredLinkApiClient(baseUrl);
export const apiClient = createApiClient();



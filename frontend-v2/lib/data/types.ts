import type {
  AccountRole,
  AccountStatus,
  ApiResponse,
  AuditEventType,
  AuditLogRecord,
  AuthUserRecord,
  CitizenSummary,
  ConsentDomain,
  ConsentRecord,
  CredentialDomain,
  CredentialRecord,
  CredentialStatus,
  HealthCheckResponse,
  MemberRole,
  OrganizationMembership,
  OrganizationSummary,
  OrgDomain,
  OrgVerificationStatus,
  Pagination,
  ProfileRecord,
  SharedAccessResult,
  TrustRegistryEntry,
  TrustStatus,
  VerificationCheck,
} from '@/lib/types';

/**
 * The actor the data client is answering for. In a live deployment the backend
 * derives this from the bearer token; the mock client receives it explicitly so
 * that scoping is visible in the code instead of implied.
 */
export interface ActorContext {
  userId: string;
  role: AccountRole;
  accountStatus: AccountStatus;
  organizationId: string | null;
  memberRole: MemberRole | null;
}

export interface SignInResult {
  user: AuthUserRecord;
  memberships: OrganizationMembership[];
  /**
   * Always null in the design preview. No authentication service is connected in this
   * build, so no token is minted and none is stored. The live client returns an
   * AuthSession here and the UI reads it the same way.
   */
  session: null;
  mode: 'demo';
}

export interface SignInInput {
  email: string;
  password: string;
  /** Demonstration switch: forces the transport failure path the API returns as 503. */
  simulateOffline?: boolean;
}

export interface RegisterInput {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  requestedRole: AccountRole;
}

export interface RegisterResult {
  user: AuthUserRecord;
  memberships: OrganizationMembership[];
  session: null;
  mode: 'demo';
  /** The role the API actually assigned. A requested ADMIN is downgraded to CITIZEN. */
  assignedRole: AccountRole;
  requestedRole: AccountRole;
  roleDowngraded: boolean;
}

export interface PagedResult<T> {
  items: T[];
  pagination: Pagination;
}

export interface CredentialQuery {
  page?: number;
  limit?: number;
  domain?: CredentialDomain;
  status?: CredentialStatus;
  subjectId?: string;
  issuerOrgId?: string;
  search?: string;
}

export interface ConsentQuery {
  page?: number;
  limit?: number;
  status?: ConsentRecord['status'];
  domain?: ConsentDomain;
  citizenId?: string;
  requestingOrgId?: string;
  credentialId?: string;
  search?: string;
}

export interface OrganizationQuery {
  page?: number;
  limit?: number;
  domain?: OrgDomain;
  verificationStatus?: OrgVerificationStatus;
  search?: string;
}

export interface TrustQuery {
  page?: number;
  limit?: number;
  trustStatus?: TrustStatus;
  domain?: CredentialDomain;
  search?: string;
}

export interface AuditQuery {
  page?: number;
  limit?: number;
  domain?: string;
  eventType?: AuditEventType;
  search?: string;
}

export interface IssueCredentialInput {
  subjectId: string;
  domain: CredentialDomain;
  credentialType: string;
  title: string;
  claims: Record<string, string>;
  expiresAt?: string;
}

export interface RequestConsentInput {
  citizenId: string;
  credentialId: string;
  purpose: string;
  requestedClaims: string[];
  /** ISO date. The backend validator rejects any other expiry field (finding F-05). */
  expiresAt?: string;
}

export interface ConsentDecisionInput {
  action: 'APPROVE' | 'DENY';
  approvedClaims?: string[];
  /** ISO datetime. The backend validator accepts `expiresAt` and rejects any other expiry field (finding F-05). */
  expiresAt?: string;
}

export interface VerifyInput {
  credentialId: string;
  consentId?: string;
  verifierOrgId?: string;
}

export interface CreateOrganizationInput {
  name: string;
  code: string;
  domain: OrgDomain;
  registrationRef?: string;
}

export interface DataClient {
  readonly mode: 'mock';
  signIn(input: SignInInput): Promise<ApiResponse<SignInResult>>;
  register(input: RegisterInput): Promise<ApiResponse<RegisterResult>>;
  getMe(): Promise<ApiResponse<{ user: AuthUserRecord; memberships: OrganizationMembership[] }>>;

  listCredentials(query?: CredentialQuery): Promise<ApiResponse<PagedResult<CredentialRecord>>>;
  getCredential(id: string): Promise<ApiResponse<CredentialRecord>>;
  issueCredential(input: IssueCredentialInput): Promise<ApiResponse<CredentialRecord>>;
  revokeCredential(id: string, reason: string): Promise<ApiResponse<CredentialRecord>>;

  listConsents(query?: ConsentQuery): Promise<ApiResponse<PagedResult<ConsentRecord>>>;
  getConsent(id: string): Promise<ApiResponse<ConsentRecord>>;
  requestConsent(input: RequestConsentInput): Promise<ApiResponse<ConsentRecord>>;
  respondConsent(id: string, decision: ConsentDecisionInput): Promise<ApiResponse<ConsentRecord>>;
  revokeConsent(id: string): Promise<ApiResponse<ConsentRecord>>;
  accessSharedCredential(input: { credentialId: string }): Promise<ApiResponse<SharedAccessResult>>;
  verifyCredential(input: VerifyInput): Promise<ApiResponse<VerificationCheck>>;

  listOrganizations(query?: OrganizationQuery): Promise<ApiResponse<PagedResult<OrganizationSummary>>>;
  getOrganization(id: string): Promise<ApiResponse<OrganizationSummary>>;
  createOrganization(input: CreateOrganizationInput): Promise<ApiResponse<OrganizationSummary>>;
  updateOrganizationStatus(
    id: string,
    input: { verificationStatus: OrgVerificationStatus; isIssuer?: boolean; authorizedCredentialTypes?: string[] },
  ): Promise<ApiResponse<OrganizationSummary>>;

  listTrustRegistry(query?: TrustQuery): Promise<ApiResponse<PagedResult<TrustRegistryEntry>>>;
  getTrustEntry(orgIdOrDid: string): Promise<ApiResponse<TrustRegistryEntry>>;
  registerTrustIssuer(input: { organizationId: string; verificationMetadata?: Record<string, unknown> }): Promise<ApiResponse<TrustRegistryEntry>>;
  updateTrustStatus(
    id: string,
    input: { trustStatus: TrustStatus; reason?: string },
  ): Promise<ApiResponse<TrustRegistryEntry>>;

  listCitizens(): Promise<ApiResponse<CitizenSummary[]>>;
  getProfile(): Promise<ApiResponse<ProfileRecord>>;
  updateProfile(input: { fullName?: string; phone?: string }): Promise<ApiResponse<ProfileRecord>>;
  listAuditLogs(query?: AuditQuery): Promise<ApiResponse<PagedResult<AuditLogRecord>>>;
  checkHealth(): Promise<ApiResponse<HealthCheckResponse>>;
}
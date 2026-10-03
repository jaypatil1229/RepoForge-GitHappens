/**
 * CredLink domain types.
 *
 * Every vocabulary here mirrors a database CHECK constraint or a verified backend
 * response shape as recorded in docs/FRONTEND_RECONNAISSANCE.md sections 4 and 9.1.
 * Do not widen a union to make a screen compile; widen the fixture or the adapter.
 */

// ---------------------------------------------------------------------------
// Vocabularies (must match the database CHECK constraints)
// ---------------------------------------------------------------------------

export type AccountRole = 'CITIZEN' | 'COLLEGE' | 'BANK' | 'HOSPITAL' | 'EMPLOYER' | 'ADMIN';
export type AccountStatus = 'ACTIVE' | 'SUSPENDED';
export type MemberRole = 'ADMIN' | 'ISSUER' | 'VERIFIER' | 'MEMBER';
export type MemberStatus = 'ACTIVE' | 'SUSPENDED';
export type OrgDomain = 'college' | 'employer' | 'bank' | 'hospital' | 'network_admin';
export type OrgVerificationStatus = 'PENDING' | 'APPROVED' | 'DENIED';
export type CredentialDomain = 'education' | 'employment' | 'finance' | 'healthcare';
export type ConsentDomain = CredentialDomain | 'all';
export type CredentialStatus = 'VALID' | 'REVOKED' | 'EXPIRED';
export type ConsentStatus = 'PENDING' | 'APPROVED' | 'DENIED' | 'REVOKED' | 'EXPIRED';
export type TrustStatus = 'VERIFIED' | 'SUSPENDED' | 'REVOKED';
export type VerificationResult = 'APPROVED' | 'REJECTED';
export type AuditOutcome = 'SUCCESS' | 'FAILURE' | 'PENDING';
export type AuditEventType =
  | 'CREDENTIAL_ISSUED'
  | 'CREDENTIAL_REVOKED'
  | 'VERIFICATION_REQUESTED'
  | 'VERIFICATION_APPROVED'
  | 'ORGANIZATION_STATUS_CHANGED'
  | 'CONSENT_GRANTED'
  | 'CONSENT_REVOKED';

export const ACCOUNT_ROLES: AccountRole[] = ['CITIZEN', 'COLLEGE', 'BANK', 'HOSPITAL', 'EMPLOYER', 'ADMIN'];
export const CREDENTIAL_DOMAINS: CredentialDomain[] = ['education', 'employment', 'finance', 'healthcare'];
export const ORG_DOMAINS: OrgDomain[] = ['college', 'employer', 'bank', 'hospital', 'network_admin'];
export const MEMBER_ROLES: MemberRole[] = ['ADMIN', 'ISSUER', 'VERIFIER', 'MEMBER'];

// ---------------------------------------------------------------------------
// Transport
// ---------------------------------------------------------------------------

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  details?: { field: string; message: string }[];
  timestamp: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface Paged<T> {
  items: T[];
  pagination: Pagination;
}

// ---------------------------------------------------------------------------
// Identity and organisations
// ---------------------------------------------------------------------------

export interface AuthSession {
  access_token: string;
  refresh_token: string;
  expires_at?: number;
}

export interface AuthUserRecord {
  id: string;
  email: string;
  fullName: string;
  phone?: string | null;
  role: AccountRole;
  status: AccountStatus;
  organizationId: string | null;
  organizationName: string;
  organizationCode: string | null;
  organizationDomain: OrgDomain | null;
  organizationDid: string;
  organizationStatus: OrgVerificationStatus | null;
  isIssuer: boolean;
  authorizedCredentialTypes: string[];
  createdAt?: string;
}

export interface OrganizationSummary {
  id: string;
  name: string;
  code: string;
  domain: OrgDomain;
  did: string;
  verificationStatus: OrgVerificationStatus;
  isIssuer: boolean;
  authorizedCredentialTypes: string[];
  registrationRef: string | null;
  createdAt: string;
}

export interface OrganizationMembership {
  id: string;
  memberRole: MemberRole;
  status: MemberStatus;
  organization: OrganizationSummary;
}

export interface ProfileRecord {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  role: AccountRole;
  accountStatus: AccountStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CitizenSummary {
  id: string;
  fullName: string;
  email: string;
  accountStatus: AccountStatus;
  credentialCount: number;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Credentials
// ---------------------------------------------------------------------------

export interface CredentialIssuerRef {
  id: string;
  name: string;
  did: string;
}

export interface CredentialRecord {
  id: string;
  subjectId: string;
  subjectName: string | null;
  issuerOrgId: string;
  issuer: CredentialIssuerRef | null;
  domain: CredentialDomain;
  credentialType: string;
  title: string;
  claims: Record<string, unknown> | unknown[];
  issuanceDate: string;
  expirationDate: string | null;
  status: CredentialStatus;
  revocationReason: string | null;
  revokedAt: string | null;
  issuerSignature?: string;
  qrPayload?: string;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Consents
// ---------------------------------------------------------------------------

export interface ConsentRecord {
  id: string;
  citizenId: string;
  citizenName: string | null;
  citizenEmail: string | null;
  requestingOrgId: string;
  requestingOrg: { id: string; name: string; code: string } | null;
  credentialId: string | null;
  credential: { id: string; title: string; credentialType: string; status: CredentialStatus } | null;
  domain: ConsentDomain;
  purpose: string;
  requestedClaims: string[];
  approvedClaims: string[];
  status: ConsentStatus;
  grantedAt: string | null;
  expiresAt: string | null;
  consumedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Trust registry
// ---------------------------------------------------------------------------

export interface TrustRegistryEntry {
  id: string;
  organizationId: string;
  issuerIdentifier: string;
  organization: OrganizationSummary | null;
  trustStatus: TrustStatus;
  verificationMetadata: { accreditedFor?: CredentialDomain; [key: string]: unknown };
  lastVerifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Verification
// ---------------------------------------------------------------------------

export interface VerificationCheck {
  verified: boolean;
  verificationResult: VerificationResult;
  reason: string | null;
  mode?: 'BASIC_VERIFICATION' | 'BANK_VERIFICATION_REQUEST';
  credentialSummary?: {
    id: string;
    subjectId: string;
    domain: CredentialDomain;
    credentialType: string;
    title: string;
    status: CredentialStatus;
  };
  allowedClaims?: Record<string, unknown>;
  consentDetails?: { consentId: string; status: 'CONSUMED'; consumedAt: string; purpose: string } | null;
  trustRegistryCheck?: {
    issuerDid: string;
    issuerName?: string;
    isTrusted: boolean;
    trustStatus: TrustStatus | 'UNREGISTERED';
    accreditedFor?: CredentialDomain | null;
    requiredDomain?: CredentialDomain;
  };
  lifecycleCheck?: {
    status: CredentialStatus | 'EXPIRED';
    isRevoked: boolean;
    isExpired: boolean;
    issuanceDate?: string;
    expirationDate?: string | null;
  };
  cryptographicCheck?: { signatureValid: boolean; algorithm: string; verifiedAt?: string };
}

export interface SharedAccessResult {
  sharedClaims: Record<string, unknown>;
  consentId: string;
  credentialId: string;
  requestingOrgId: string;
  requestedClaims: string[];
  approvedClaims: string[];
  purpose: string;
  status: 'GRANTED';
  grantedAt: string;
}

// ---------------------------------------------------------------------------
// Audit
// ---------------------------------------------------------------------------

export interface AuditLogRecord {
  id: string;
  timestamp: string;
  eventType: AuditEventType;
  action: string;
  domain: string;
  outcome: AuditOutcome;
  actor: string;
  actorId: string | null;
  organization: string;
  organizationId: string | null;
  targetResourceId: string | null;
  metadata: Record<string, unknown>;
  details: string;
}

// ---------------------------------------------------------------------------
// Health
// ---------------------------------------------------------------------------

export interface HealthCheckResponse {
  status: 'ok' | 'degraded';
  service: string;
  database: 'connected' | 'unavailable';
  timestamp: string;
}
/**
 * Adapters between the backend's exact response shapes and the CredLink V2 domain
 * model. Every field that the backend names differently (snake_case database rows,
 * `verification_status`, `credentials`/`consents`/`logs` list keys) is converted
 * here, so no UI component or screen ever sees a raw backend payload.
 *
 * The functions are intentionally tolerant of both camelCase and snake_case inputs
 * so the same adapter can run in a route handler (raw Supabase rows) and in the
 * browser (formatted backend payloads).
 */

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
  ConsentStatus,
  CredentialDomain,
  CredentialRecord,
  CredentialStatus,
  MemberRole,
  MemberStatus,
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
import type { PagedResult } from '@/lib/data/types';

type Raw = Record<string, any>;

const ACCOUNT_ROLES: AccountRole[] = ['CITIZEN', 'COLLEGE', 'BANK', 'HOSPITAL', 'EMPLOYER', 'ADMIN'];
const MEMBER_ROLES: MemberRole[] = ['ADMIN', 'ISSUER', 'VERIFIER', 'MEMBER'];
const CREDENTIAL_DOMAINS: CredentialDomain[] = ['education', 'employment', 'finance', 'healthcare'];
const CREDENTIAL_STATUSES: CredentialStatus[] = ['VALID', 'REVOKED', 'EXPIRED'];
const CONSENT_STATUSES: ConsentStatus[] = ['PENDING', 'APPROVED', 'DENIED', 'REVOKED', 'EXPIRED'];
const TRUST_STATUSES: TrustStatus[] = ['VERIFIED', 'SUSPENDED', 'REVOKED'];
const ORG_STATUSES: OrgVerificationStatus[] = ['PENDING', 'APPROVED', 'DENIED'];

function pick<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return typeof value === 'string' && (allowed as readonly string[]).includes(value) ? (value as T) : fallback;
}

function str(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

/**
 * The backend stores its signed W3C envelope and internal references on the claims
 * object (`_w3c`, `_rawJwt`, `_issuerDid`, `_subjectDid`). Those are not user claims;
 * exposing them would clutter the detail view and duplicate the signed JWT, so they
 * are stripped for presentation only.
 */
function sanitizeClaims(value: unknown): Record<string, unknown> | unknown[] {
  if (Array.isArray(value)) return value;
  if (value && typeof value === 'object') {
    const output: Record<string, unknown> = {};
    for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
      if (key.startsWith('_')) continue;
      output[key] = entry;
    }
    return output;
  }
  return {};
}

function nullableStr(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

export function asRole(value: unknown): AccountRole {
  return pick(typeof value === 'string' ? value.toUpperCase() : value, ACCOUNT_ROLES, 'CITIZEN');
}

export function asAccountStatus(value: unknown): AccountStatus {
  return pick(value, ['ACTIVE', 'SUSPENDED'] as const, 'ACTIVE');
}

export function asMemberRole(value: unknown): MemberRole {
  return pick(typeof value === 'string' ? value.toUpperCase() : value, MEMBER_ROLES, 'MEMBER');
}

/** The backend returns `'admin'` for the network governance organization. */
export function asOrgDomain(value: unknown): OrgDomain | null {
  if (typeof value !== 'string' || value.length === 0) return null;
  const lower = value.toLowerCase();
  if (lower === 'admin' || lower === 'network_admin' || lower === 'network-admin') return 'network_admin';
  return pick(lower, ['college', 'employer', 'bank', 'hospital'] as const, 'college');
}

export function asOrgVerificationStatus(value: unknown): OrgVerificationStatus | null {
  if (typeof value !== 'string') return null;
  const upper = value.toUpperCase();
  if (ORG_STATUSES.includes(upper as OrgVerificationStatus)) return upper as OrgVerificationStatus;
  return null;
}

export function asCredentialDomain(value: unknown): CredentialDomain {
  const lower = typeof value === 'string' ? value.toLowerCase() : '';
  if (lower === 'college') return 'education';
  if (lower === 'hospital') return 'healthcare';
  if (lower === 'bank') return 'finance';
  if (lower === 'employer') return 'employment';
  return pick(lower, CREDENTIAL_DOMAINS, 'education');
}

export function asConsentDomain(value: unknown): ConsentDomain {
  if (typeof value === 'string' && value.toLowerCase() === 'all') return 'all';
  return asCredentialDomain(value);
}

// ---------------------------------------------------------------------------
// Identity
// ---------------------------------------------------------------------------

export function normalizeUser(raw: Raw | null | undefined): AuthUserRecord {
  const source = raw ?? {};
  return {
    id: str(source.id, str(source.userId)),
    email: str(source.email),
    fullName: str(source.fullName, str(source.full_name)),
    phone: nullableStr(source.phone),
    role: asRole(source.role),
    status: asAccountStatus(source.status ?? source.account_status),
    organizationId: nullableStr(source.organizationId ?? source.organization_id),
    organizationName: str(source.organizationName ?? source.organization_name, 'Unaffiliated Citizen'),
    organizationCode: nullableStr(source.organizationCode ?? source.organization_code),
    organizationDomain: asOrgDomain(source.organizationDomain ?? source.organization_domain),
    organizationDid: str(source.organizationDid ?? source.organization_did),
    organizationStatus: asOrgVerificationStatus(source.organizationStatus ?? source.organization_status),
    isIssuer: Boolean(source.isIssuer ?? source.is_issuer),
    authorizedCredentialTypes: Array.isArray(source.authorizedCredentialTypes)
      ? source.authorizedCredentialTypes
      : Array.isArray(source.authorized_credential_types)
        ? source.authorized_credential_types
        : [],
    createdAt: nullableStr(source.createdAt ?? source.created_at) ?? undefined,
  };
}

export function normalizeOrganization(raw: Raw | null | undefined): OrganizationSummary {
  const source = raw ?? {};
  const domain = asOrgDomain(source.domain);
  return {
    id: str(source.id),
    name: str(source.name),
    code: str(source.code),
    domain: domain ?? 'college',
    did: str(source.did),
    verificationStatus: asOrgVerificationStatus(source.verificationStatus ?? source.verification_status ?? source.status) ?? 'PENDING',
    isIssuer: Boolean(source.isIssuer ?? source.is_issuer),
    authorizedCredentialTypes: Array.isArray(source.authorizedCredentialTypes)
      ? source.authorizedCredentialTypes
      : Array.isArray(source.authorized_credential_types)
        ? source.authorized_credential_types
        : [],
    registrationRef: nullableStr(source.registrationRef ?? source.registration_ref),
    createdAt: str(source.createdAt ?? source.created_at),
  };
}

export function normalizeMembership(raw: Raw | null | undefined): OrganizationMembership {
  const source = raw ?? {};
  const org = source.organization;
  return {
    id: str(source.id),
    memberRole: asMemberRole(source.memberRole ?? source.member_role),
    status: pick(source.status, ['ACTIVE', 'SUSPENDED'] as const, 'ACTIVE') as MemberStatus,
    organization: normalizeOrganization(Array.isArray(org) ? org[0] : org),
  };
}

export function normalizeProfile(raw: Raw | null | undefined): ProfileRecord {
  const source = raw ?? {};
  return {
    id: str(source.id),
    fullName: str(source.fullName, str(source.full_name)),
    email: str(source.email),
    phone: nullableStr(source.phone),
    role: asRole(source.role),
    accountStatus: asAccountStatus(source.accountStatus ?? source.account_status),
    createdAt: str(source.createdAt ?? source.created_at),
    updatedAt: str(source.updatedAt ?? source.updated_at),
  };
}

export function normalizeCitizen(raw: Raw | null | undefined): CitizenSummary {
  const source = raw ?? {};
  return {
    id: str(source.id),
    fullName: str(source.fullName, str(source.full_name)),
    email: str(source.email),
    accountStatus: asAccountStatus(source.accountStatus ?? source.account_status),
    credentialCount: Number(source.credentialCount ?? source.credential_count ?? 0),
    createdAt: str(source.createdAt ?? source.created_at),
  };
}

// ---------------------------------------------------------------------------
// Credentials
// ---------------------------------------------------------------------------

export function normalizeCredential(raw: Raw | null | undefined): CredentialRecord {
  const source = raw ?? {};
  const issuer = source.issuer;
  return {
    id: str(source.id),
    subjectId: str(source.subjectId ?? source.subject_id),
    subjectName: nullableStr(source.subjectName ?? source.subject_name),
    issuerOrgId: str(source.issuerOrgId ?? source.issuer_org_id),
    issuer: issuer ? { id: str(issuer.id), name: str(issuer.name), did: str(issuer.did) } : null,
    domain: asCredentialDomain(source.domain),
    credentialType: str(source.credentialType ?? source.credential_type),
    title: str(source.title),
    claims: sanitizeClaims(source.claims),
    issuanceDate: str(source.issuanceDate ?? source.issuance_date),
    expirationDate: nullableStr(source.expirationDate ?? source.expiration_date),
    status: pick(source.status, CREDENTIAL_STATUSES, 'VALID'),
    revocationReason: nullableStr(source.revocationReason ?? source.revocation_reason),
    revokedAt: nullableStr(source.revokedAt ?? source.revoked_at),
    issuerSignature: nullableStr(source.issuerSignature ?? source.issuer_signature) ?? undefined,
    qrPayload: nullableStr(source.qrPayload ?? source.qr_payload) ?? undefined,
    createdAt: str(source.createdAt ?? source.created_at),
    updatedAt: str(source.updatedAt ?? source.updated_at),
  };
}

// ---------------------------------------------------------------------------
// Consents
// ---------------------------------------------------------------------------

export function normalizeConsent(raw: Raw | null | undefined): ConsentRecord {
  const source = raw ?? {};
  const credential = source.credential;
  const requester = source.requestingOrg ?? source.requesting_org;
  return {
    id: str(source.id),
    citizenId: str(source.citizenId ?? source.citizen_id),
    citizenName: nullableStr(source.citizenName ?? source.citizen_name),
    citizenEmail: nullableStr(source.citizenEmail ?? source.citizen_email),
    requestingOrgId: str(source.requestingOrgId ?? source.requesting_org_id),
    requestingOrg: requester ? { id: str(requester.id), name: str(requester.name), code: str(requester.code) } : null,
    credentialId: nullableStr(source.credentialId ?? source.credential_id),
    credential: credential
      ? {
          id: str(credential.id),
          title: str(credential.title),
          credentialType: str(credential.credentialType ?? credential.credential_type),
          status: pick(credential.status, CREDENTIAL_STATUSES, 'VALID'),
        }
      : null,
    domain: asConsentDomain(source.domain),
    purpose: str(source.purpose),
    requestedClaims: Array.isArray(source.requestedClaims) ? source.requestedClaims : Array.isArray(source.requested_claims) ? source.requested_claims : [],
    approvedClaims: Array.isArray(source.approvedClaims) ? source.approvedClaims : Array.isArray(source.approved_claims) ? source.approved_claims : [],
    status: pick(source.status, CONSENT_STATUSES, 'PENDING'),
    grantedAt: nullableStr(source.grantedAt ?? source.granted_at),
    expiresAt: nullableStr(source.expiresAt ?? source.expires_at),
    consumedAt: nullableStr(source.consumedAt ?? source.consumed_at),
    createdAt: str(source.createdAt ?? source.created_at),
    updatedAt: str(source.updatedAt ?? source.updated_at),
  };
}

// ---------------------------------------------------------------------------
// Trust registry
// ---------------------------------------------------------------------------

export function normalizeTrustEntry(raw: Raw | null | undefined): TrustRegistryEntry {
  const source = raw ?? {};
  const metadata = source.verificationMetadata ?? source.verification_metadata ?? {};
  return {
    id: str(source.id),
    organizationId: str(source.organizationId ?? source.organization_id),
    issuerIdentifier: str(source.issuerIdentifier ?? source.issuer_identifier),
    organization: source.organization ? normalizeOrganization(Array.isArray(source.organization) ? source.organization[0] : source.organization) : null,
    trustStatus: pick(source.trustStatus ?? source.trust_status, TRUST_STATUSES, 'VERIFIED'),
    verificationMetadata: metadata,
    lastVerifiedAt: nullableStr(source.lastVerifiedAt ?? source.last_verified_at),
    createdAt: str(source.createdAt ?? source.created_at),
    updatedAt: str(source.updatedAt ?? source.updated_at),
  };
}

// ---------------------------------------------------------------------------
// Audit
// ---------------------------------------------------------------------------

const AUDIT_EVENT_TYPES: AuditEventType[] = [
  'CREDENTIAL_ISSUED',
  'CREDENTIAL_REVOKED',
  'VERIFICATION_REQUESTED',
  'VERIFICATION_APPROVED',
  'ORGANIZATION_STATUS_CHANGED',
  'CONSENT_GRANTED',
  'CONSENT_REVOKED',
];

export function normalizeAuditLog(raw: Raw | null | undefined): AuditLogRecord {
  const source = raw ?? {};
  const metadata = source.metadata ?? {};
  return {
    id: str(source.id),
    timestamp: str(source.timestamp ?? source.created_at),
    eventType: pick(source.eventType ?? source.event_type, AUDIT_EVENT_TYPES, 'VERIFICATION_REQUESTED'),
    action: str(source.action),
    domain: str(source.domain, 'NETWORK'),
    outcome: pick(source.outcome, ['SUCCESS', 'FAILURE', 'PENDING'] as const, 'SUCCESS'),
    actor: str(source.actor),
    actorId: nullableStr(source.actorId ?? source.actor_id),
    organization: str(source.organization, 'CredLink Network Governance'),
    organizationId: nullableStr(source.organizationId ?? source.organization_id),
    targetResourceId: nullableStr(source.targetResourceId ?? source.target_resource_id),
    metadata: typeof metadata === 'object' && metadata !== null ? metadata : {},
    details: str(source.details, JSON.stringify(metadata ?? {}, null, 2)),
  };
}

// ---------------------------------------------------------------------------
// Verification
// ---------------------------------------------------------------------------

export function normalizeVerification(raw: Raw | null | undefined): VerificationCheck {
  const source = raw ?? {};
  const summary = source.credentialSummary ?? {};
  const trust = source.trustRegistryCheck ?? {};
  const lifecycle = source.lifecycleCheck ?? {};
  const crypto = source.cryptographicCheck ?? {};
  const consent = source.consentDetails ?? source.consentSummary ?? null;
  const accredited = trust.accreditedFor ?? trust.accredited_for ?? null;

  return {
    verified: Boolean(source.verified),
    verificationResult: source.verificationResult === 'APPROVED' ? 'APPROVED' : 'REJECTED',
    reason: nullableStr(source.reason),
    mode: source.mode === 'BANK_VERIFICATION_REQUEST' ? 'BANK_VERIFICATION_REQUEST' : 'BASIC_VERIFICATION',
    credentialSummary: summary.id
      ? {
          id: str(summary.id),
          subjectId: str(summary.subjectId ?? summary.subject_id),
          domain: asCredentialDomain(summary.domain),
          credentialType: str(summary.credentialType ?? summary.credential_type),
          title: str(summary.title),
          status: pick(summary.status, CREDENTIAL_STATUSES, 'VALID'),
        }
      : undefined,
    allowedClaims: source.allowedClaims ?? source.allowed_claims ?? undefined,
    consentDetails: consent
      ? {
          consentId: str(consent.consentId ?? consent.consent_id ?? consent.id),
          status: 'CONSUMED',
          consumedAt: str(consent.consumedAt ?? consent.consumed_at),
          purpose: str(consent.purpose),
        }
      : null,
    trustRegistryCheck: {
      issuerDid: str(trust.issuerDid ?? trust.issuer_did),
      issuerName: str(trust.issuerName ?? trust.issuer_name, 'Unknown issuer'),
      isTrusted: Boolean(trust.isTrusted ?? trust.is_trusted),
      trustStatus: (() => {
        const value = trust.trustStatus ?? trust.trust_status;
        if (typeof value === 'string' && (TRUST_STATUSES as string[]).includes(value)) return value as TrustStatus;
        return 'UNREGISTERED';
      })(),
      accreditedFor: Array.isArray(accredited) ? asCredentialDomain(accredited[0]) : accredited ? asCredentialDomain(accredited) : null,
      requiredDomain: summary.domain ? asCredentialDomain(summary.domain) : undefined,
    },
    lifecycleCheck: lifecycle.status
      ? {
          status: pick(lifecycle.status, CREDENTIAL_STATUSES, 'VALID'),
          isRevoked: Boolean(lifecycle.isRevoked ?? lifecycle.is_revoked),
          isExpired: Boolean(lifecycle.isExpired ?? lifecycle.is_expired),
          issuanceDate: nullableStr(lifecycle.issuanceDate ?? lifecycle.issuance_date) ?? undefined,
          expirationDate: nullableStr(lifecycle.expirationDate ?? lifecycle.expiration_date),
        }
      : undefined,
    cryptographicCheck: crypto.algorithm
      ? {
          signatureValid: Boolean(crypto.signatureValid ?? crypto.signature_valid),
          algorithm: str(crypto.algorithm),
          verifiedAt: nullableStr(crypto.verifiedAt ?? crypto.verified_at) ?? undefined,
        }
      : undefined,
  };
}

export function normalizeSharedAccess(raw: Raw, requestingOrgId: string): SharedAccessResult {
  const source = raw ?? {};
  const sharedClaims = source.sharedClaims ?? source.shared_claims ?? {};
  const keys = Object.keys(sharedClaims);
  return {
    sharedClaims,
    consentId: str(source.consentId ?? source.consent_id),
    credentialId: str(source.credentialId ?? source.credential_id),
    requestingOrgId,
    requestedClaims: keys,
    approvedClaims: keys,
    purpose: str(source.purpose),
    status: 'GRANTED',
    grantedAt: str(source.accessedAt ?? source.accessed_at ?? new Date().toISOString()),
  };
}

// ---------------------------------------------------------------------------
// Envelope and pagination
// ---------------------------------------------------------------------------

export function normalizePagination(raw: Raw | undefined, fallback: { page: number; limit: number; total: number }): Pagination {
  const source = raw ?? {};
  const total = Number(source.total ?? fallback.total);
  const limit = Number(source.limit ?? fallback.limit);
  return {
    page: Number(source.page ?? fallback.page),
    limit,
    total,
    totalPages: Number(source.totalPages ?? source.total_pages ?? Math.max(1, Math.ceil(total / Math.max(1, limit)))),
  };
}

const LIST_KEYS = ['items', 'credentials', 'consents', 'logs', 'organizations', 'entries', 'trustRegistry', 'trust_registry', 'registry', 'results', 'data'];

export function extractItems(raw: Raw | undefined): unknown[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  for (const key of LIST_KEYS) {
    if (Array.isArray(raw[key])) return raw[key];
  }
  const firstArray = Object.values(raw).find((value) => Array.isArray(value));
  return Array.isArray(firstArray) ? firstArray : [];
}

export function pagedResult<T>(
  raw: Raw | undefined,
  mapper: (item: Raw) => T,
  fallback: { page: number; limit: number },
): PagedResult<T> {
  const items = extractItems(raw).map((item) => mapper((item ?? {}) as Raw));
  return {
    items,
    pagination: normalizePagination(raw?.pagination as Raw | undefined, {
      page: fallback.page,
      limit: fallback.limit,
      total: items.length,
    }),
  };
}

/** Build an error envelope from a raw backend error payload. */
export function errorEnvelope(raw: unknown, fallback: string): ApiResponse<never> {
  const source = (raw ?? {}) as Raw;
  return {
    success: false,
    error: typeof source.error === 'string' && source.error.length > 0 ? source.error : fallback,
    details: Array.isArray(source.details) ? source.details : undefined,
    timestamp: str(source.timestamp, new Date().toISOString()),
  };
}
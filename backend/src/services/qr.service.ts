import crypto from 'crypto';
import QRCode from 'qrcode';
import { supabaseAdmin } from '../config/supabase';
import { AppError } from '../types/index';
import { AuthUser } from '../middleware/authMiddleware';

// ── QR Payload Contract v1 ──────────────────────────────────────────────────
// Consent Request QR:  { v: 1, type: "consent_request", id: "<consent-uuid>", ts: <unix-seconds> }
// Credential QR:       { v: 1, type: "credential",       id: "<credential-uuid>", ts: <unix-seconds> }
//
// QR codes contain ONLY a reference (never full credential data).
// All resolution happens through authenticated backend APIs.
// ─────────────────────────────────────────────────────────────────────────────

export interface QrPayload {
  v: number;
  type: 'consent_request' | 'credential';
  id: string;
  ts: number;
}

const QR_PAYLOAD_VERSION = 1;
const QR_PAYLOAD_MAX_AGE_SECONDS = 86400 * 30; // 30 days

export interface EligibilityEvaluation {
  isEligible: boolean;
  reason?: string;
  matchedCredential?: {
    id: string;
    title: string;
    credentialType: string;
    status: string;
    claims: string[];
  } | null;
  availableClaims: string[];
  missingClaims: string[];
}

export function extractClaimKeys(claims: any): string[] {
  if (!claims) return [];
  if (Array.isArray(claims)) {
    return claims
      .map((c) => {
        if (typeof c === 'string') return c.trim();
        if (c && typeof c === 'object') {
          return String(c.key || c.label || c.name || '').trim();
        }
        return '';
      })
      .filter(Boolean);
  }
  if (typeof claims === 'object') {
    return Object.keys(claims).map((k) => k.trim());
  }
  return [];
}

export function matchesClaim(availableKeys: string[], requestedClaim: string): boolean {
  const reqNorm = requestedClaim.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
  if (!reqNorm) return true;
  return availableKeys.some((avail) => {
    const availNorm = avail.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
    return availNorm.includes(reqNorm) || reqNorm.includes(availNorm);
  });
}

export async function evaluateConsentEligibility(
  citizenId: string,
  consent: {
    id: string;
    credential_id?: string | null;
    domain?: string | null;
    requested_claims?: string[] | null;
    status: string;
    expires_at?: string | null;
  }
): Promise<EligibilityEvaluation> {
  if (consent.expires_at && new Date(consent.expires_at) < new Date()) {
    return {
      isEligible: false,
      reason: 'Verification consent request has expired.',
      matchedCredential: null,
      availableClaims: [],
      missingClaims: consent.requested_claims || [],
    };
  }

  if (consent.status !== 'PENDING') {
    return {
      isEligible: false,
      reason: `Consent request has already been ${consent.status.toLowerCase()}.`,
      matchedCredential: null,
      availableClaims: [],
      missingClaims: [],
    };
  }

  const requestedClaims = consent.requested_claims || [];

  // If specific credential targeted
  if (consent.credential_id) {
    const { data: cred, error } = await supabaseAdmin
      .from('credentials')
      .select('id, title, credential_type, status, claims, subject_id')
      .eq('id', consent.credential_id)
      .maybeSingle();

    if (error || !cred) {
      return {
        isEligible: false,
        reason: 'Target credential not found in network records.',
        matchedCredential: null,
        availableClaims: [],
        missingClaims: requestedClaims,
      };
    }

    if (cred.subject_id !== citizenId) {
      return {
        isEligible: false,
        reason: 'Target credential does not belong to your citizen profile.',
        matchedCredential: null,
        availableClaims: [],
        missingClaims: requestedClaims,
      };
    }

    if (cred.status !== 'VALID') {
      return {
        isEligible: false,
        reason: `Target credential is not active (Status: ${cred.status}). Only VALID credentials can be disclosed.`,
        matchedCredential: {
          id: cred.id,
          title: cred.title,
          credentialType: cred.credential_type,
          status: cred.status,
          claims: [],
        },
        availableClaims: [],
        missingClaims: requestedClaims,
      };
    }

    const availableKeys = extractClaimKeys(cred.claims);
    const missing = requestedClaims.filter((rc) => !matchesClaim(availableKeys, rc));

    if (missing.length > 0) {
      return {
        isEligible: false,
        reason: `Credential is missing requested claim(s): ${missing.join(', ')}.`,
        matchedCredential: {
          id: cred.id,
          title: cred.title,
          credentialType: cred.credential_type,
          status: cred.status,
          claims: availableKeys,
        },
        availableClaims: availableKeys,
        missingClaims: missing,
      };
    }

    return {
      isEligible: true,
      matchedCredential: {
        id: cred.id,
        title: cred.title,
        credentialType: cred.credential_type,
        status: cred.status,
        claims: availableKeys,
      },
      availableClaims: availableKeys,
      missingClaims: [],
    };
  }

  // General domain request (no specific credential ID)
  let query = supabaseAdmin
    .from('credentials')
    .select('id, title, credential_type, status, claims, domain, subject_id')
    .eq('subject_id', citizenId)
    .eq('status', 'VALID');

  if (consent.domain && consent.domain.toLowerCase() !== 'all') {
    query = query.eq('domain', consent.domain.toLowerCase());
  }

  const { data: userCredentials } = await query;
  let candidateCreds = (userCredentials && userCredentials.length > 0) ? userCredentials : [];

  if (candidateCreds.length === 0) {
    // Try broader query across all domains
    const { data: allCreds } = await supabaseAdmin
      .from('credentials')
      .select('id, title, credential_type, status, claims, domain, subject_id')
      .eq('subject_id', citizenId)
      .eq('status', 'VALID');

    if (!allCreds || allCreds.length === 0) {
      return {
        isEligible: false,
        reason: `You do not possess any valid credentials in the ${consent.domain || 'requested'} domain to satisfy this request.`,
        matchedCredential: null,
        availableClaims: [],
        missingClaims: requestedClaims,
      };
    }
    candidateCreds = allCreds;
  }

  let bestMatch: any = null;
  let allAvailableClaims: string[] = [];

  for (const cred of candidateCreds) {
    const keys = extractClaimKeys(cred.claims);
    allAvailableClaims.push(...keys);
    const missing = requestedClaims.filter((rc) => !matchesClaim(keys, rc));
    if (missing.length === 0) {
      bestMatch = { cred, keys };
      break;
    }
  }

  allAvailableClaims = Array.from(new Set(allAvailableClaims));
  const missingOverall = requestedClaims.filter((rc) => !matchesClaim(allAvailableClaims, rc));

  if (bestMatch) {
    return {
      isEligible: true,
      matchedCredential: {
        id: bestMatch.cred.id,
        title: bestMatch.cred.title,
        credentialType: bestMatch.cred.credential_type,
        status: bestMatch.cred.status,
        claims: bestMatch.keys,
      },
      availableClaims: bestMatch.keys,
      missingClaims: [],
    };
  }

  if (missingOverall.length > 0) {
    return {
      isEligible: false,
      reason: `Missing required claim(s) in wallet: ${missingOverall.join(', ')}.`,
      matchedCredential: candidateCreds[0]
        ? {
            id: candidateCreds[0].id,
            title: candidateCreds[0].title,
            credentialType: candidateCreds[0].credential_type,
            status: candidateCreds[0].status,
            claims: extractClaimKeys(candidateCreds[0].claims),
          }
        : null,
      availableClaims: allAvailableClaims,
      missingClaims: missingOverall,
    };
  }

  return {
    isEligible: true,
    matchedCredential: candidateCreds[0]
      ? {
          id: candidateCreds[0].id,
          title: candidateCreds[0].title,
          credentialType: candidateCreds[0].credential_type,
          status: candidateCreds[0].status,
          claims: extractClaimKeys(candidateCreds[0].claims),
        }
      : null,
    availableClaims: allAvailableClaims,
    missingClaims: [],
  };
}

export class QrService {
  /**
   * Parse and validate a raw QR payload string.
   * Treats all input as untrusted.
   */
  parsePayload(raw: string): QrPayload {
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new AppError('Invalid QR code: not a valid JSON payload', 400);
    }

    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      throw new AppError('Invalid QR code: unexpected payload structure', 400);
    }

    const obj = parsed as Record<string, unknown>;

    // Version check
    if (typeof obj.v !== 'number' || obj.v !== QR_PAYLOAD_VERSION) {
      throw new AppError(
        `Unsupported QR payload version: ${obj.v ?? 'missing'}. Expected version ${QR_PAYLOAD_VERSION}.`,
        400
      );
    }

    // Type check
    if (obj.type !== 'consent_request' && obj.type !== 'credential') {
      throw new AppError(`Unsupported QR payload type: ${String(obj.type)}`, 400);
    }

    // ID validation (must be UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (typeof obj.id !== 'string' || !uuidRegex.test(obj.id)) {
      throw new AppError('Invalid QR code: missing or malformed resource ID', 400);
    }

    // Timestamp validation
    if (typeof obj.ts !== 'number' || obj.ts <= 0) {
      throw new AppError('Invalid QR code: missing timestamp', 400);
    }

    const ageSeconds = Math.floor(Date.now() / 1000) - obj.ts;
    if (ageSeconds > QR_PAYLOAD_MAX_AGE_SECONDS) {
      throw new AppError('QR code has expired. Please request a new one.', 400);
    }

    return {
      v: QR_PAYLOAD_VERSION,
      type: obj.type,
      id: obj.id,
      ts: obj.ts,
    };
  }

  /**
   * Generate a QR code Data URL for a consent request.
   * Only organization members who created the request can generate the QR.
   */
  async generateConsentQr(actor: AuthUser, consentId: string): Promise<{ qrDataUrl: string; payload: QrPayload }> {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(consentId)) {
      throw new AppError('Invalid consent ID format', 400);
    }

    // Verify the consent request exists
    const { data: consent, error } = await supabaseAdmin
      .from('consents')
      .select('id, requesting_org_id, citizen_id, status')
      .eq('id', consentId)
      .maybeSingle();

    if (error || !consent) {
      throw new AppError('Consent request not found', 404);
    }

    // Authorization: only requesting org members or admins can generate QR
    if (actor.role !== 'ADMIN') {
      const { data: member } = await supabaseAdmin
        .from('organization_members')
        .select('status')
        .eq('organization_id', consent.requesting_org_id)
        .eq('user_id', actor.id)
        .eq('status', 'ACTIVE')
        .maybeSingle();

      if (!member) {
        throw new AppError('Forbidden. Only members of the requesting organization can generate this QR code.', 403);
      }
    }

    const payload: QrPayload = {
      v: QR_PAYLOAD_VERSION,
      type: 'consent_request',
      id: consent.id,
      ts: Math.floor(Date.now() / 1000),
    };

    const payloadString = JSON.stringify(payload);
    const qrDataUrl = await QRCode.toDataURL(payloadString, {
      errorCorrectionLevel: 'M',
      margin: 2,
      width: 300,
      color: {
        dark: '#0f172a', // slate-900
        light: '#ffffff',
      },
    });

    return { qrDataUrl, payload };
  }

  /**
   * Generate a QR code Data URL for a credential reference.
   * Only the credential subject or issuing org members can generate this.
   */
  async generateCredentialQr(actor: AuthUser, credentialId: string): Promise<{ qrDataUrl: string; payload: QrPayload }> {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(credentialId)) {
      throw new AppError('Invalid credential ID format', 400);
    }

    const { data: cred, error } = await supabaseAdmin
      .from('credentials')
      .select('id, subject_id, issuer_org_id, status')
      .eq('id', credentialId)
      .maybeSingle();

    if (error || !cred) {
      throw new AppError('Credential not found', 404);
    }

    // Authorization: subject, issuer org member, or admin
    if (actor.role !== 'ADMIN' && cred.subject_id !== actor.id) {
      const { data: member } = await supabaseAdmin
        .from('organization_members')
        .select('status')
        .eq('organization_id', cred.issuer_org_id)
        .eq('user_id', actor.id)
        .eq('status', 'ACTIVE')
        .maybeSingle();

      if (!member) {
        throw new AppError('Forbidden. You are not authorized to generate a QR for this credential.', 403);
      }
    }

    if (cred.status === 'REVOKED') {
      throw new AppError('Cannot generate QR for a revoked credential', 400);
    }

    const payload: QrPayload = {
      v: QR_PAYLOAD_VERSION,
      type: 'credential',
      id: cred.id,
      ts: Math.floor(Date.now() / 1000),
    };

    const payloadString = JSON.stringify(payload);
    const qrDataUrl = await QRCode.toDataURL(payloadString, {
      errorCorrectionLevel: 'M',
      margin: 2,
      width: 300,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    });

    return { qrDataUrl, payload };
  }

  /**
   * Resolve a scanned QR payload (consent request type).
   * Returns the full consent request details along with authoritative eligibility evaluation for citizen review.
   * The citizen must be the target of the consent request.
   */
  async resolveConsentQr(actor: AuthUser, payload: QrPayload) {
    if (payload.type !== 'consent_request') {
      throw new AppError('Invalid QR type: expected consent_request', 400);
    }

    const { data: consent, error } = await supabaseAdmin
      .from('consents')
      .select('*, requesting_org:organizations(id, name, code, domain, did), citizen:profiles(id, full_name, email), credential:credentials(id, title, credential_type, status)')
      .eq('id', payload.id)
      .maybeSingle();

    if (error || !consent) {
      throw new AppError('Consent request not found or has been deleted', 404);
    }

    // Authorization: only the target citizen or admin can resolve
    if (actor.role !== 'ADMIN' && consent.citizen_id !== actor.id) {
      throw new AppError('Forbidden. This consent request is not addressed to you.', 403);
    }

    // Check if already processed
    if (consent.status !== 'PENDING') {
      const reqOrg = Array.isArray(consent.requesting_org) ? consent.requesting_org[0] : consent.requesting_org;
      const credObj = Array.isArray(consent.credential) ? consent.credential[0] : consent.credential;
      return {
        id: consent.id,
        status: consent.status,
        alreadyProcessed: true,
        eligibility: {
          isEligible: false,
          reason: `Request has already been ${consent.status.toLowerCase()}.`,
          matchedCredential: null,
          availableClaims: [],
          missingClaims: [],
        },
        requestingOrg: reqOrg ? { id: reqOrg.id, name: reqOrg.name, code: reqOrg.code, domain: reqOrg.domain } : null,
        credential: credObj ? { id: credObj.id, title: credObj.title, credentialType: credObj.credential_type, status: credObj.status } : null,
        domain: consent.domain,
        purpose: consent.purpose,
        requestedClaims: consent.requested_claims || [],
        expiresAt: consent.expires_at,
        createdAt: consent.created_at,
      };
    }

    // Check expiry
    if (consent.expires_at && new Date(consent.expires_at) < new Date()) {
      await supabaseAdmin.from('consents').update({ status: 'EXPIRED' }).eq('id', consent.id);
      throw new AppError('This consent request has expired', 400);
    }

    // Evaluate authoritative eligibility
    const eligibility = await evaluateConsentEligibility(actor.id, consent);

    const reqOrg = Array.isArray(consent.requesting_org) ? consent.requesting_org[0] : consent.requesting_org;
    const credObj = Array.isArray(consent.credential) ? consent.credential[0] : consent.credential;

    return {
      id: consent.id,
      status: consent.status,
      alreadyProcessed: false,
      eligibility,
      requestingOrg: reqOrg ? { id: reqOrg.id, name: reqOrg.name, code: reqOrg.code, domain: reqOrg.domain } : null,
      credential: credObj ? { id: credObj.id, title: credObj.title, credentialType: credObj.credential_type, status: credObj.status } : null,
      domain: consent.domain,
      purpose: consent.purpose,
      requestedClaims: consent.requested_claims || [],
      expiresAt: consent.expires_at,
      createdAt: consent.created_at,
    };
  }
}

export const qrService = new QrService();


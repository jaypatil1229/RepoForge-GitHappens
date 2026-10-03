/**
 * Landing-page demo content.
 *
 * Every value here is synthetic and fixed. The same records appear in the hero,
 * the lifecycle, the consent scene and the portal so a visitor following the page
 * never sees the story change underneath them.
 */

export interface LandingClaim {
  key: string;
  label: string;
  value: string;
  /** Shown in the request card but not pre-approved, so selective sharing is visible. */
  optional?: boolean;
}

export interface LandingCredential {
  institution: string;
  institutionKind: string;
  award: string;
  field: string;
  holder: string;
  issued: string;
  identifier: string;
  claims: LandingClaim[];
}

export const demoCredential: LandingCredential = {
  institution: 'Westbridge University',
  institutionKind: 'Accredited issuer · education',
  award: 'Bachelor of Science',
  field: 'Computer Science',
  holder: 'Aarav Mehta',
  issued: '28 June 2026',
  identifier: 'urn:credlink:cred:4f21a9c2',
  claims: [
    { key: 'degree', label: 'Award', value: 'Bachelor of Science' },
    { key: 'field', label: 'Field of study', value: 'Computer Science' },
    { key: 'classification', label: 'Classification', value: 'First class' },
    { key: 'graduationYear', label: 'Awarded', value: '2026', optional: true },
  ],
};

export const requester = {
  name: 'Apex Global Bank',
  purpose: 'Graduate scheme application',
};

export const lifecycleStages = [
  {
    key: 'issued',
    label: 'Issued',
    state: 'Signed',
    detail: 'The university signs the record with its issuer key.',
  },
  {
    key: 'held',
    label: 'Held',
    state: 'In your records',
    detail: 'It appears in your CredLink records, with its source attached.',
  },
  {
    key: 'approved',
    label: 'Approved',
    state: 'Claims chosen',
    detail: 'You allow the exact claims this request needs. Nothing else moves.',
  },
  {
    key: 'verified',
    label: 'Verified',
    state: 'Proof checked',
    detail: 'The recipient checks the signature, the issuer and the current status.',
  },
] as const;

export const verificationScenarios = [
  { key: 'active', label: 'Active' },
  { key: 'revoked', label: 'Revoked' },
  { key: 'suspended', label: 'Issuer suspended' },
] as const;

export type VerificationScenarioKey = (typeof verificationScenarios)[number]['key'];

export const verificationChecks = [
  'Credential present',
  'Signature matches the issuer key',
  'Issuer trusted for this domain',
  'Credential is active',
] as const;

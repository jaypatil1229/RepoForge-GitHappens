/**
 * Synthetic CredLink fixtures.
 *
 * Rules this file follows, taken from docs/FRONTEND_RECONNAISSANCE.md section 9.2:
 *  - every record is synthetic and internally consistent;
 *  - no contradictory states (an approved consent never points at a declined request,
 *    a revoked credential is never presented as active);
 *  - vocabulary matches the database CHECK constraints, not the marketing copy.
 *
 * Nothing here is exported directly to a component. Components read through
 * `lib/mock/services.ts`, which applies the same scoping rules as the backend.
 */

import type {
  AuditLogRecord,
  CitizenSummary,
  ConsentRecord,
  CredentialRecord,
  OrganizationSummary,
  ProfileRecord,
  TrustRegistryEntry,
} from '@/lib/types';

/**
 * Every relative timestamp in the demo is anchored to this instant instead of the
 * visitor's clock, so the fixtures stay consistent no matter when the app is opened.
 */
export const DEMO_NOW = new Date('2026-10-03T09:30:00.000Z');

export const DEMO_NOW_ISO = DEMO_NOW.toISOString();

/** Clearly synthetic signature placeholder. Never present this as a real issued proof. */
export function demoSignature(subject: string): string {
  const header = 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCIsImtpZCI6ImNyZWRsaW5rLWRlbW8ifQ';
  const claims = 'eyJpc3MiOiJkaWQ6a2V5OmNyZWRsaW5rLWRlbW8taXNzdWVyIiwibmFtZSI6IlN5bnRoZXRpYyBEZW1vIElzc3VlciJ9';
  return `${header}.${claims}.ZGVtby1zaWduYXR1cmUtZm9yLS${subject.replace(/[^a-zA-Z0-9]/g, '')}`;
}

// ---------------------------------------------------------------------------
// Organisations
// ---------------------------------------------------------------------------

export const organizations: OrganizationSummary[] = [
  {
    id: 'org-oxford',
    name: 'Oxford University (Synthetic)',
    code: 'OX-0448',
    domain: 'college',
    did: 'did:key:z6MkpTHR8VNsKQw4fJx2mZc7LbYdE9rA1vUgH3sTnBoW',
    verificationStatus: 'APPROVED',
    isIssuer: true,
    authorizedCredentialTypes: ['Degree', 'Transcript', 'Diploma', 'Certificate'],
    registrationRef: 'UKPRN-1004471',
    createdAt: '2024-01-15T10:00:00.000Z',
  },
  {
    id: 'org-aiims',
    name: 'AIIMS (Synthetic)',
    code: 'AIIMS-0668',
    domain: 'hospital',
    did: 'did:key:z6Mkr4XqWbY8mN2dLpS6vTcJ1hZfE5gKaUoP3nRyQiD',
    verificationStatus: 'APPROVED',
    isIssuer: true,
    authorizedCredentialTypes: ['ImmunizationRecord', 'MedicalCertificate', 'HealthSummary'],
    registrationRef: 'HFR-2291043',
    createdAt: '2024-02-02T09:15:00.000Z',
  },
  {
    id: 'org-techcorp',
    name: 'TechCorp Solutions (Synthetic)',
    code: 'TC-7250',
    domain: 'employer',
    did: 'did:key:z6Mkj9LmQwX2vRtY7bNpS4dKcH1aZfE8gUoP5nRyQiT',
    verificationStatus: 'APPROVED',
    isIssuer: true,
    authorizedCredentialTypes: ['EmploymentRecord', 'OfferLetter', 'EmploymentVerification'],
    registrationRef: 'CIN-U72900MH2016',
    createdAt: '2024-01-28T14:40:00.000Z',
  },
  {
    id: 'org-northbridge',
    name: 'Northbridge Credit Union (Synthetic)',
    code: 'NBCU-1190',
    domain: 'bank',
    did: 'did:key:z6Mks2VbN8mQwX4vRtY7LpSdK1cHfE9gUoP3nRyQiZ',
    verificationStatus: 'APPROVED',
    isIssuer: true,
    authorizedCredentialTypes: ['IncomeStatement', 'BankStatement'],
    registrationRef: 'FCA-773412',
    createdAt: '2024-03-11T11:05:00.000Z',
  },
  {
    id: 'org-kingsley',
    name: 'Kingsley College (Synthetic)',
    code: 'KCS-3320',
    domain: 'college',
    did: 'did:key:z6Mkh5TrQ2mWbX8vRtY4LpSdK1cNfE9gUoP3nRyQiB',
    verificationStatus: 'APPROVED',
    isIssuer: true,
    authorizedCredentialTypes: ['Diploma', 'Transcript', 'Certificate'],
    registrationRef: 'UKPRN-1009922',
    createdAt: '2024-05-20T08:30:00.000Z',
  },
  {
    id: 'org-meridian',
    name: 'Meridian Health Network (Synthetic)',
    code: 'MHN-2210',
    domain: 'hospital',
    did: 'did:key:z6Mkn7YbQ4mWvX2sRtL8pSdK1cHfE5gUoP3nRyQiD',
    verificationStatus: 'PENDING',
    isIssuer: false,
    authorizedCredentialTypes: [],
    registrationRef: 'HFR-2291887',
    createdAt: '2026-09-24T15:12:00.000Z',
  },
  {
    id: 'org-apex',
    name: 'Apex Global Bank (Synthetic)',
    code: 'BNK-0448',
    domain: 'bank',
    did: 'did:key:z6Mkw3VbN9mQxX5vRtY2LpSdK1cHfE7gUoP3nRyQiH',
    verificationStatus: 'APPROVED',
    isIssuer: false,
    authorizedCredentialTypes: [],
    registrationRef: 'FCA-114920',
    createdAt: '2024-04-09T13:25:00.000Z',
  },
  {
    id: 'org-cascade',
    name: 'Cascade Institute (Synthetic)',
    code: 'CI-8810',
    domain: 'college',
    did: 'did:key:z6Mkc8VbQ3mWxX6vRtY1LpSdK9cHfE4gUoP2nRyQiM',
    verificationStatus: 'DENIED',
    isIssuer: false,
    authorizedCredentialTypes: [],
    registrationRef: 'UKPRN-1007745',
    createdAt: '2024-07-19T12:00:00.000Z',
  },
  {

    id: 'org-governance',
    name: 'CredLink Network Governance',
    code: 'GOV-ROOT',
    domain: 'network_admin',
    did: 'did:key:z6MkGovernance4Q2mVrL9dXbN1sT8pR3hKcYw',
    verificationStatus: 'APPROVED',
    isIssuer: true,
    authorizedCredentialTypes: ['NetworkAttestation'],
    registrationRef: null,
    createdAt: '2023-12-01T00:00:00.000Z',
  },
];

export const organizationsById: Record<string, OrganizationSummary> = Object.fromEntries(
  organizations.map((org) => [org.id, org]),
);
// ---------------------------------------------------------------------------
// People
// ---------------------------------------------------------------------------

export interface DemoAccountSeed {
  /** Stable id used by the demo context selector. Not an authentication credential. */
  key: string;
  email: string;
  fullName: string;
  role: ProfileRecord['role'];
  accountStatus: ProfileRecord['accountStatus'];
  organizationId: string | null;
  membershipId: string | null;
  memberRole: 'ADMIN' | 'ISSUER' | 'VERIFIER' | 'MEMBER' | null;
  headline: string;
}

export const demoAccounts: DemoAccountSeed[] = [
  {
    key: 'citizen',
    email: 'citizen@credlink.org',
    fullName: 'Aarav Mehta',
    role: 'CITIZEN',
    accountStatus: 'ACTIVE',
    organizationId: null,
    membershipId: null,
    memberRole: null,
    headline: 'Holds four credentials across education, employment, healthcare, and finance.',
  },
  {
    key: 'college',
    email: 'college@credlink.org',
    fullName: 'Dr. Helena Marsh',
    role: 'COLLEGE',
    accountStatus: 'ACTIVE',
    organizationId: 'org-oxford',
    membershipId: 'mem-oxford-1',
    memberRole: 'ADMIN',
    headline: 'Oxford University (Synthetic) — approved issuer for education credentials.',
  },
  {
    key: 'hospital',
    email: 'hospital@credlink.org',
    fullName: 'Dr. Rohan Iyer',
    role: 'HOSPITAL',
    accountStatus: 'ACTIVE',
    organizationId: 'org-aiims',
    membershipId: 'mem-aiims-1',
    memberRole: 'ADMIN',
    headline: 'AIIMS (Synthetic) — approved issuer and verifier in healthcare.',
  },
  {
    key: 'bank',
    email: 'finance@credlink.org',
    fullName: 'Nadia Rahman',
    role: 'BANK',
    accountStatus: 'ACTIVE',
    organizationId: 'org-apex',
    membershipId: 'mem-apex-1',
    memberRole: 'VERIFIER',
    headline: 'Apex Global Bank (Synthetic) — verifier only, no issuance authorization.',
  },
  {
    key: 'employer',
    email: 'employer@credlink.org',
    fullName: 'Marcus Feld',
    role: 'EMPLOYER',
    accountStatus: 'ACTIVE',
    organizationId: 'org-techcorp',
    membershipId: 'mem-techcorp-1',
    memberRole: 'ISSUER',
    headline: 'TechCorp Solutions (Synthetic) — approved issuer for employment records.',
  },
  {
    key: 'issuer-suspended-trust',
    email: 'northbridge@credlink.org',
    fullName: 'Elena Kovacs',
    role: 'BANK',
    accountStatus: 'ACTIVE',
    organizationId: 'org-northbridge',
    membershipId: 'mem-northbridge-1',
    memberRole: 'ISSUER',
    headline: 'Northbridge Credit Union (Synthetic) — issued records, trust status suspended.',
  },
  {
    key: 'admin',
    email: 'admin@credlink.org',
    fullName: 'Priyanka Desai',
    role: 'ADMIN',
    accountStatus: 'ACTIVE',
    organizationId: null,
    membershipId: null,
    memberRole: null,
    headline: 'CredLink Network Governance — approves organizations and manages trust.',
  },
  {
    key: 'suspended',
    email: 'suspended@credlink.org',
    fullName: 'Tomas Berg',
    role: 'CITIZEN',
    accountStatus: 'SUSPENDED',
    organizationId: null,
    membershipId: null,
    memberRole: null,
    headline: 'Suspended account. Kept in the fixture to exercise the real 403 state.',
  },
];

export const profiles: ProfileRecord[] = [
  { id: 'usr-citizen', fullName: 'Aarav Mehta', email: 'citizen@credlink.org', phone: '+91 98••• ••213', role: 'CITIZEN', accountStatus: 'ACTIVE', createdAt: '2024-06-04T08:10:00.000Z', updatedAt: '2026-08-19T12:02:00.000Z' },
  { id: 'usr-college', fullName: 'Dr. Helena Marsh', email: 'college@credlink.org', phone: '+44 7700 •••421', role: 'COLLEGE', accountStatus: 'ACTIVE', createdAt: '2024-01-20T09:00:00.000Z', updatedAt: '2026-07-30T10:44:00.000Z' },
  { id: 'usr-hospital', fullName: 'Dr. Rohan Iyer', email: 'hospital@credlink.org', phone: '+91 98••• ••889', role: 'HOSPITAL', accountStatus: 'ACTIVE', createdAt: '2024-02-05T07:25:00.000Z', updatedAt: '2026-06-11T15:18:00.000Z' },
  { id: 'usr-bank', fullName: 'Nadia Rahman', email: 'finance@credlink.org', phone: '+971 50 ••• 771', role: 'BANK', accountStatus: 'ACTIVE', createdAt: '2024-04-12T11:30:00.000Z', updatedAt: '2026-09-01T09:05:00.000Z' },
  { id: 'usr-employer', fullName: 'Marcus Feld', email: 'employer@credlink.org', phone: '+49 152 ••• 338', role: 'EMPLOYER', accountStatus: 'ACTIVE', createdAt: '2024-01-29T16:45:00.000Z', updatedAt: '2026-05-22T13:40:00.000Z' },
  { id: 'usr-northbridge', fullName: 'Elena Kovacs', email: 'northbridge@credlink.org', phone: '+44 7700 •••908', role: 'BANK', accountStatus: 'ACTIVE', createdAt: '2024-03-12T10:15:00.000Z', updatedAt: '2026-09-28T08:55:00.000Z' },
  { id: 'usr-admin', fullName: 'Priyanka Desai', email: 'admin@credlink.org', phone: '+91 99••• ••004', role: 'ADMIN', accountStatus: 'ACTIVE', createdAt: '2023-12-01T00:00:00.000Z', updatedAt: '2026-10-02T17:30:00.000Z' },
  { id: 'usr-suspended', fullName: 'Tomas Berg', email: 'suspended@credlink.org', phone: null, role: 'CITIZEN', accountStatus: 'SUSPENDED', createdAt: '2024-06-04T08:10:00.000Z', updatedAt: '2026-02-18T07:00:00.000Z' },
  { id: 'cit-priya', fullName: 'Priya Nair', email: 'priya.nair@example.test', phone: null, role: 'CITIZEN', accountStatus: 'ACTIVE', createdAt: '2024-09-02T10:00:00.000Z', updatedAt: '2026-08-01T10:00:00.000Z' },
  { id: 'cit-daniel', fullName: 'Daniel Okafor', email: 'daniel.okafor@example.test', phone: null, role: 'CITIZEN', accountStatus: 'ACTIVE', createdAt: '2024-09-18T10:00:00.000Z', updatedAt: '2026-08-14T10:00:00.000Z' },
  { id: 'cit-meilin', fullName: 'Mei Lin Tan', email: 'meilin.tan@example.test', phone: null, role: 'CITIZEN', accountStatus: 'ACTIVE', createdAt: '2025-01-11T10:00:00.000Z', updatedAt: '2026-07-06T10:00:00.000Z' },
  { id: 'cit-sofia', fullName: 'Sofia Alvarez', email: 'sofia.alvarez@example.test', phone: null, role: 'CITIZEN', accountStatus: 'ACTIVE', createdAt: '2025-03-27T10:00:00.000Z', updatedAt: '2026-09-19T10:00:00.000Z' },
];

export const profileById: Record<string, ProfileRecord> = Object.fromEntries(
  profiles.map((profile) => [profile.id, profile]),
);

export const citizens: CitizenSummary[] = profiles
  .filter((profile) => profile.role === 'CITIZEN')
  .map((profile) => ({
    id: profile.id,
    fullName: profile.fullName,
    email: profile.email,
    accountStatus: profile.accountStatus,
    credentialCount: 0,
    createdAt: profile.createdAt,
  }));
// ---------------------------------------------------------------------------
// Credentials
// ---------------------------------------------------------------------------

type CredentialSeed = Omit<CredentialRecord, 'subjectName' | 'issuer'>;

function issued(
  seed: Omit<CredentialSeed, 'issuerSignature' | 'qrPayload'> & Partial<Pick<CredentialSeed, 'issuerSignature' | 'qrPayload'>>,
): CredentialSeed {
  return {
    ...seed,
    issuerSignature: seed.issuerSignature ?? demoSignature(seed.id),
    qrPayload: seed.qrPayload ?? `credlink:vc:${seed.id}:${seed.id.slice(-6)}`,
  };
}

export const credentialSeeds: CredentialSeed[] = [
  issued({
    id: 'cred-1001', subjectId: 'usr-citizen', issuerOrgId: 'org-oxford', domain: 'education',
    credentialType: 'Degree', title: 'Bachelor of Science in Computer Science',
    claims: { award: 'Bachelor of Science', field: 'Computer Science', classification: 'First Class', graduationDate: '2019-06-28' },
    issuanceDate: '2019-06-28T00:00:00.000Z', expirationDate: null, status: 'VALID',
    revocationReason: null, revokedAt: null, createdAt: '2019-06-28T09:00:00.000Z', updatedAt: '2019-06-28T09:00:00.000Z',
  }),
  issued({
    id: 'cred-1002', subjectId: 'usr-citizen', issuerOrgId: 'org-techcorp', domain: 'employment',
    credentialType: 'EmploymentRecord', title: 'Employment Record — Senior Software Engineer',
    claims: { employer: 'TechCorp Solutions (Synthetic)', role: 'Senior Software Engineer', startDate: '2024-02-01', employmentType: 'Full time', employeeId: 'TC-88214' },
    issuanceDate: '2026-02-01T00:00:00.000Z', expirationDate: null, status: 'VALID',
    revocationReason: null, revokedAt: null, createdAt: '2026-02-01T08:30:00.000Z', updatedAt: '2026-02-01T08:30:00.000Z',
  }),
  issued({
    id: 'cred-1003', subjectId: 'usr-citizen', issuerOrgId: 'org-aiims', domain: 'healthcare',
    credentialType: 'ImmunizationRecord', title: 'Routine Immunization Record',
    claims: { vaccine: 'Tetanus and diphtheria booster', doses: 1, administeredOn: '2023-11-14', batchRef: 'AIIMS-IM-7741' },
    issuanceDate: '2023-11-14T00:00:00.000Z', expirationDate: '2028-11-14T00:00:00.000Z', status: 'VALID',
    revocationReason: null, revokedAt: null, createdAt: '2023-11-14T12:05:00.000Z', updatedAt: '2023-11-14T12:05:00.000Z',
  }),
  issued({
    id: 'cred-1004', subjectId: 'usr-citizen', issuerOrgId: 'org-northbridge', domain: 'finance',
    credentialType: 'IncomeStatement', title: 'Annual Income Statement 2025-26',
    claims: { assessmentYear: '2025-26', grossIncome: 'GBP 84,500', currency: 'GBP', statementRef: 'NBCU-IS-2026-4471' },
    issuanceDate: '2026-04-10T00:00:00.000Z', expirationDate: '2027-04-10T00:00:00.000Z', status: 'VALID',
    revocationReason: null, revokedAt: null, createdAt: '2026-04-10T10:20:00.000Z', updatedAt: '2026-04-10T10:20:00.000Z',
  }),
  issued({
    id: 'cred-1005', subjectId: 'cit-priya', issuerOrgId: 'org-oxford', domain: 'education',
    credentialType: 'Degree', title: 'Master of Public Health',
    claims: { award: 'Master of Public Health', field: 'Epidemiology', classification: 'Distinction', graduationDate: '2021-07-16' },
    issuanceDate: '2021-07-16T00:00:00.000Z', expirationDate: null, status: 'VALID',
    revocationReason: null, revokedAt: null, createdAt: '2021-07-16T09:40:00.000Z', updatedAt: '2021-07-16T09:40:00.000Z',
  }),
  issued({
    id: 'cred-1006', subjectId: 'cit-priya', issuerOrgId: 'org-aiims', domain: 'healthcare',
    credentialType: 'MedicalCertificate', title: 'Fitness to Practise Certificate',
    claims: { certificateType: 'Occupational health clearance', validUntil: '2025-09-30', issuedBy: 'AIIMS Occupational Health' },
    issuanceDate: '2024-10-01T00:00:00.000Z', expirationDate: '2025-09-30T00:00:00.000Z', status: 'EXPIRED',
    revocationReason: null, revokedAt: null, createdAt: '2024-10-01T09:10:00.000Z', updatedAt: '2024-10-01T09:10:00.000Z',
  }),
  issued({
    id: 'cred-1007', subjectId: 'cit-daniel', issuerOrgId: 'org-techcorp', domain: 'employment',
    credentialType: 'EmploymentRecord', title: 'Employment Record — Operations Lead',
    claims: { employer: 'TechCorp Solutions (Synthetic)', role: 'Operations Lead', startDate: '2021-03-08', employmentType: 'Full time', employeeId: 'TC-51200' },
    issuanceDate: '2025-03-08T00:00:00.000Z', expirationDate: null, status: 'REVOKED',
    revocationReason: 'Employment ended 2 May 2025. Record superseded by a final settlement statement.',
    revokedAt: '2026-06-01T09:20:00.000Z', createdAt: '2026-03-08T07:45:00.000Z', updatedAt: '2026-06-01T09:20:00.000Z',
  }),
  issued({
    id: 'cred-1008', subjectId: 'cit-daniel', issuerOrgId: 'org-kingsley', domain: 'education',
    credentialType: 'Diploma', title: 'Advanced Diploma in Logistics Management',
    claims: { award: 'Advanced Diploma', field: 'Logistics Management', completionDate: '2018-08-31' },
    issuanceDate: '2018-08-31T00:00:00.000Z', expirationDate: null, status: 'VALID',
    revocationReason: null, revokedAt: null, createdAt: '2018-08-31T11:00:00.000Z', updatedAt: '2018-08-31T11:00:00.000Z',
  }),
  issued({
    id: 'cred-1009', subjectId: 'cit-meilin', issuerOrgId: 'org-northbridge', domain: 'finance',
    credentialType: 'BankStatement', title: 'Verified Bank Statement — Q1 2026',
    claims: { accountHolder: 'Mei Lin Tan', statementPeriod: 'Jan to Mar 2026', averageBalance: 'GBP 12,940', currency: 'GBP' },
    issuanceDate: '2026-04-04T00:00:00.000Z', expirationDate: '2026-10-04T00:00:00.000Z', status: 'VALID',
    revocationReason: null, revokedAt: null, createdAt: '2026-04-04T13:15:00.000Z', updatedAt: '2026-04-04T13:15:00.000Z',
  }),
  issued({
    id: 'cred-1010', subjectId: 'cit-meilin', issuerOrgId: 'org-techcorp', domain: 'employment',
    credentialType: 'EmploymentRecord', title: 'Employment Record — Product Designer',
    claims: { employer: 'TechCorp Solutions (Synthetic)', role: 'Product Designer', startDate: '2023-06-12', employmentType: 'Full time', employeeId: 'TC-73310' },
    issuanceDate: '2026-06-12T00:00:00.000Z', expirationDate: null, status: 'VALID',
    revocationReason: null, revokedAt: null, createdAt: '2026-06-12T09:05:00.000Z', updatedAt: '2026-06-12T09:05:00.000Z',
  }),
  issued({
    id: 'cred-1011', subjectId: 'cit-sofia', issuerOrgId: 'org-kingsley', domain: 'education',
    credentialType: 'Transcript', title: 'Academic Transcript — Bachelor of Commerce',
    claims: { programme: 'Bachelor of Commerce', awardDate: '2022-05-20', overallResult: 'Upper second class' },
    issuanceDate: '2022-05-20T00:00:00.000Z', expirationDate: null, status: 'VALID',
    revocationReason: null, revokedAt: null, createdAt: '2022-05-20T10:35:00.000Z', updatedAt: '2022-05-20T10:35:00.000Z',
  }),
  issued({
    id: 'cred-1012', subjectId: 'cit-sofia', issuerOrgId: 'org-aiims', domain: 'healthcare',
    credentialType: 'ImmunizationRecord', title: 'Travel Immunization Record',
    claims: { vaccine: 'Yellow fever', doses: 1, administeredOn: '2026-01-22', batchRef: 'AIIMS-IM-9910' },
    issuanceDate: '2026-01-22T00:00:00.000Z', expirationDate: '2036-01-22T00:00:00.000Z', status: 'VALID',
    revocationReason: null, revokedAt: null, createdAt: '2026-01-22T08:15:00.000Z', updatedAt: '2026-01-22T08:15:00.000Z',
  }),
  issued({
    id: 'cred-1013', subjectId: 'usr-citizen', issuerOrgId: 'org-oxford', domain: 'education',
    credentialType: 'Transcript', title: 'Academic Transcript — Computer Science',
    claims: { programme: 'BSc Computer Science', awardDate: '2019-06-28', credits: 360, classification: 'First Class' },
    issuanceDate: '2019-07-04T00:00:00.000Z', expirationDate: null, status: 'VALID',
    revocationReason: null, revokedAt: null, createdAt: '2019-07-04T09:00:00.000Z', updatedAt: '2019-07-04T09:00:00.000Z',
  }),
  issued({
    id: 'cred-1014', subjectId: 'cit-priya', issuerOrgId: 'org-techcorp', domain: 'employment',
    credentialType: 'OfferLetter', title: 'Offer of Employment — Senior Analyst',
    claims: { role: 'Senior Analyst', employer: 'TechCorp Solutions (Synthetic)', offeredOn: '2026-07-30', startDate: '2026-09-01' },
    issuanceDate: '2026-07-30T00:00:00.000Z', expirationDate: '2026-12-31T00:00:00.000Z', status: 'VALID',
    revocationReason: null, revokedAt: null, createdAt: '2026-07-30T14:50:00.000Z', updatedAt: '2026-07-30T14:50:00.000Z',
  }),
];
// ---------------------------------------------------------------------------
// Consents (these double as verification requests; there is no separate table)
// ---------------------------------------------------------------------------

type ConsentSeed = Omit<ConsentRecord, 'citizenName' | 'citizenEmail' | 'requestingOrg' | 'credential'>;

export const consentSeeds: ConsentSeed[] = [
  {
    id: 'cons-2001', citizenId: 'usr-citizen', requestingOrgId: 'org-apex', credentialId: 'cred-1002',
    domain: 'employment', purpose: 'Employment verification for a credit facility application',
    requestedClaims: ['employer', 'role', 'startDate'], approvedClaims: [], status: 'PENDING',
    grantedAt: null, expiresAt: '2026-10-20T23:59:00.000Z', consumedAt: null,
    createdAt: '2026-09-29T11:12:00.000Z', updatedAt: '2026-09-29T11:12:00.000Z',
  },
  {
    id: 'cons-2002', citizenId: 'usr-citizen', requestingOrgId: 'org-apex', credentialId: 'cred-1004',
    domain: 'finance', purpose: 'Affordability assessment for a credit facility',
    requestedClaims: ['assessmentYear', 'grossIncome', 'currency'], approvedClaims: ['assessmentYear', 'currency'],
    status: 'APPROVED', grantedAt: '2026-09-18T14:02:00.000Z', expiresAt: '2026-11-01T23:59:00.000Z', consumedAt: null,
    createdAt: '2026-09-17T09:40:00.000Z', updatedAt: '2026-09-18T14:02:00.000Z',
  },
  {
    id: 'cons-2003', citizenId: 'usr-citizen', requestingOrgId: 'org-meridian', credentialId: 'cred-1003',
    domain: 'healthcare', purpose: 'Immunization check before clinical placement',
    requestedClaims: ['vaccine', 'doses', 'administeredOn'], approvedClaims: [], status: 'DENIED',
    grantedAt: null, expiresAt: '2026-10-05T23:59:00.000Z', consumedAt: null,
    createdAt: '2026-09-12T08:05:00.000Z', updatedAt: '2026-09-13T07:30:00.000Z',
  },
  {
    id: 'cons-2004', citizenId: 'cit-priya', requestingOrgId: 'org-apex', credentialId: 'cred-1005',
    domain: 'education', purpose: 'Qualification check for a professional account',
    requestedClaims: ['award', 'field', 'graduationDate'], approvedClaims: ['award', 'field', 'graduationDate'],
    status: 'EXPIRED', grantedAt: '2026-08-12T10:20:00.000Z', expiresAt: '2026-09-12T23:59:00.000Z', consumedAt: '2026-08-20T13:05:00.000Z',
    createdAt: '2026-08-11T16:00:00.000Z', updatedAt: '2026-08-20T13:05:00.000Z',
  },
  {
    id: 'cons-2005', citizenId: 'cit-priya', requestingOrgId: 'org-apex', credentialId: 'cred-1006',
    domain: 'healthcare', purpose: 'Occupational health clearance for a regulated role',
    requestedClaims: ['certificateType', 'validUntil'], approvedClaims: ['certificateType', 'validUntil'],
    status: 'EXPIRED', grantedAt: '2026-07-02T11:15:00.000Z', expiresAt: '2026-09-30T23:59:00.000Z', consumedAt: null,
    createdAt: '2026-07-01T09:30:00.000Z', updatedAt: '2026-10-01T00:05:00.000Z',
  },
  {
    id: 'cons-2006', citizenId: 'cit-daniel', requestingOrgId: 'org-apex', credentialId: 'cred-1007',
    domain: 'employment', purpose: 'Income and employment confirmation for a mortgage review',
    requestedClaims: ['employer', 'role'], approvedClaims: ['employer', 'role'],
    status: 'REVOKED', grantedAt: '2026-05-02T10:00:00.000Z', expiresAt: '2026-12-31T23:59:00.000Z', consumedAt: null,
    createdAt: '2026-05-01T15:45:00.000Z', updatedAt: '2026-06-01T09:25:00.000Z',
  },
  {
    id: 'cons-2007', citizenId: 'cit-meilin', requestingOrgId: 'org-apex', credentialId: 'cred-1009',
    domain: 'finance', purpose: 'Account conduct check for a tenancy guarantee',
    requestedClaims: ['accountHolder', 'statementPeriod'], approvedClaims: ['accountHolder', 'statementPeriod'],
    status: 'APPROVED', grantedAt: '2026-09-22T12:40:00.000Z', expiresAt: '2026-10-30T23:59:00.000Z', consumedAt: null,
    createdAt: '2026-09-22T09:05:00.000Z', updatedAt: '2026-09-22T12:40:00.000Z',
  },
  {
    id: 'cons-2008', citizenId: 'cit-sofia', requestingOrgId: 'org-meridian', credentialId: 'cred-1012',
    domain: 'healthcare', purpose: 'Travel health documentation review',
    requestedClaims: ['vaccine', 'administeredOn'], approvedClaims: [], status: 'PENDING',
    grantedAt: null, expiresAt: '2026-10-18T23:59:00.000Z', consumedAt: null,
    createdAt: '2026-10-01T07:20:00.000Z', updatedAt: '2026-10-01T07:20:00.000Z',
  },
  {
    id: 'cons-2009', citizenId: 'cit-daniel', requestingOrgId: 'org-apex', credentialId: 'cred-1008',
    domain: 'education', purpose: 'Qualification check for a supervisory licence',
    requestedClaims: ['award', 'completionDate'], approvedClaims: ['award', 'completionDate'],
    status: 'APPROVED', grantedAt: '2026-09-30T08:50:00.000Z', expiresAt: '2026-11-15T23:59:00.000Z', consumedAt: null,
    createdAt: '2026-09-29T17:10:00.000Z', updatedAt: '2026-09-30T08:50:00.000Z',
  },
  {
    id: 'cons-2010', citizenId: 'usr-citizen', requestingOrgId: 'org-techcorp', credentialId: 'cred-1002',
    domain: 'employment', purpose: 'Internal record check during a role change',
    requestedClaims: ['role', 'employmentType'], approvedClaims: ['role', 'employmentType'],
    status: 'EXPIRED', grantedAt: '2026-08-02T09:00:00.000Z', expiresAt: '2026-09-01T23:59:00.000Z', consumedAt: '2026-08-03T10:15:00.000Z',
    createdAt: '2026-08-02T08:30:00.000Z', updatedAt: '2026-08-03T10:15:00.000Z',
  },
  {
    id: 'cons-2011', citizenId: 'cit-sofia', requestingOrgId: 'org-apex', credentialId: 'cred-1011',
    domain: 'education', purpose: 'Award verification for a graduate programme',
    requestedClaims: ['programme', 'awardDate'], approvedClaims: [], status: 'DENIED',
    grantedAt: null, expiresAt: '2026-09-28T23:59:00.000Z', consumedAt: null,
    createdAt: '2026-09-20T13:35:00.000Z', updatedAt: '2026-09-21T09:10:00.000Z',
  },
  {
    id: 'cons-2012', citizenId: 'cit-meilin', requestingOrgId: 'org-apex', credentialId: 'cred-1010',
    domain: 'employment', purpose: 'Employment confirmation for a rental application',
    requestedClaims: ['employer', 'role', 'startDate'], approvedClaims: [], status: 'PENDING',
    grantedAt: null, expiresAt: '2026-10-25T23:59:00.000Z', consumedAt: null,
    createdAt: '2026-10-02T15:05:00.000Z', updatedAt: '2026-10-02T15:05:00.000Z',
  },
  {
    id: 'cons-2013', citizenId: 'cit-priya', requestingOrgId: 'org-techcorp', credentialId: 'cred-1014',
    domain: 'employment', purpose: 'Confirm accepted offer details before onboarding',
    requestedClaims: ['role', 'startDate', 'employer'], approvedClaims: ['role', 'employer'],
    status: 'APPROVED', grantedAt: '2026-08-04T11:25:00.000Z', expiresAt: '2026-11-30T23:59:00.000Z', consumedAt: null,
    createdAt: '2026-08-03T10:00:00.000Z', updatedAt: '2026-08-04T11:25:00.000Z',
  },
  {
    id: 'cons-2014', citizenId: 'cit-meilin', requestingOrgId: 'org-techcorp', credentialId: 'cred-1010',
    domain: 'employment', purpose: 'Payroll identity check',
    requestedClaims: ['role', 'startDate'], approvedClaims: ['role', 'startDate'],
    status: 'APPROVED', grantedAt: '2026-09-26T09:15:00.000Z', expiresAt: '2026-10-28T23:59:00.000Z', consumedAt: null,
    createdAt: '2026-09-25T14:05:00.000Z', updatedAt: '2026-09-26T09:15:00.000Z',
  },
  {
    id: 'cons-2015', citizenId: 'cit-sofia', requestingOrgId: 'org-oxford', credentialId: 'cred-1011',
    domain: 'education', purpose: 'Transfer credit assessment for a postgraduate application',
    requestedClaims: ['programme', 'awardDate'], approvedClaims: ['programme', 'awardDate'],
    status: 'APPROVED', grantedAt: '2026-09-11T08:20:00.000Z', expiresAt: '2026-11-10T23:59:00.000Z', consumedAt: null,
    createdAt: '2026-09-10T16:40:00.000Z', updatedAt: '2026-09-11T08:20:00.000Z',
  },
  {
    id: 'cons-2016', citizenId: 'usr-citizen', requestingOrgId: 'org-aiims', credentialId: 'cred-1003',
    domain: 'healthcare', purpose: 'Confirm booster before a clinic rotation',
    requestedClaims: ['vaccine', 'administeredOn'], approvedClaims: ['vaccine', 'administeredOn'],
    status: 'APPROVED', grantedAt: '2026-10-02T10:45:00.000Z', expiresAt: '2026-10-15T23:59:00.000Z', consumedAt: null,
    createdAt: '2026-10-02T09:30:00.000Z', updatedAt: '2026-10-02T10:45:00.000Z',
  },
];
// ---------------------------------------------------------------------------
// Trust registry
// ---------------------------------------------------------------------------

export const trustEntries: TrustRegistryEntry[] = [
  {
    id: 'trust-1', organizationId: 'org-oxford', issuerIdentifier: organizationsById['org-oxford']!.did,
    organization: null,
    trustStatus: 'VERIFIED', verificationMetadata: { accreditedFor: 'education', reviewedBy: 'CredLink Network Governance', reference: 'TR-2024-0118' },
    lastVerifiedAt: '2026-08-14T09:00:00.000Z', createdAt: '2024-01-16T10:00:00.000Z', updatedAt: '2026-08-14T09:00:00.000Z',
  },
  {
    id: 'trust-2', organizationId: 'org-aiims', issuerIdentifier: organizationsById['org-aiims']!.did,
    organization: null,
    trustStatus: 'VERIFIED', verificationMetadata: { accreditedFor: 'healthcare', reviewedBy: 'CredLink Network Governance', reference: 'TR-2024-0207' },
    lastVerifiedAt: '2026-07-02T11:30:00.000Z', createdAt: '2024-02-03T09:15:00.000Z', updatedAt: '2026-07-02T11:30:00.000Z',
  },
  {
    id: 'trust-3', organizationId: 'org-techcorp', issuerIdentifier: organizationsById['org-techcorp']!.did,
    organization: null,
    trustStatus: 'VERIFIED', verificationMetadata: { accreditedFor: 'employment', reviewedBy: 'CredLink Network Governance', reference: 'TR-2024-0331' },
    lastVerifiedAt: '2026-09-09T14:20:00.000Z', createdAt: '2024-01-29T14:40:00.000Z', updatedAt: '2026-09-09T14:20:00.000Z',
  },
  {
    id: 'trust-4', organizationId: 'org-northbridge', issuerIdentifier: organizationsById['org-northbridge']!.did,
    organization: null,
    trustStatus: 'SUSPENDED',
    verificationMetadata: {
      accreditedFor: 'finance', reviewedBy: 'CredLink Network Governance', reference: 'TR-2024-0412',
      suspensionReason: 'Periodic accreditation review overdue. Issuer suspended pending re-verification.',
    },
    lastVerifiedAt: '2026-09-28T08:45:00.000Z', createdAt: '2024-03-12T11:05:00.000Z', updatedAt: '2026-09-28T08:45:00.000Z',
  },
  {
    id: 'trust-5', organizationId: 'org-cascade', issuerIdentifier: organizationsById['org-cascade']!.did,
    organization: null,
    trustStatus: 'REVOKED',
    verificationMetadata: {
      accreditedFor: 'education', reviewedBy: 'CredLink Network Governance', reference: 'TR-2024-0719',
      revocationReason: 'Institution could not evidence awarding-body authority. Registration declined and trust withdrawn.',
    },
    lastVerifiedAt: '2026-04-02T10:10:00.000Z', createdAt: '2024-07-19T12:00:00.000Z', updatedAt: '2026-04-02T10:10:00.000Z',
  },
];

// ---------------------------------------------------------------------------
// Audit log
// ---------------------------------------------------------------------------

export const auditSeeds: AuditLogRecord[] = [
  {
    id: 'aud-9001', timestamp: '2026-10-02T15:05:00.000Z', eventType: 'VERIFICATION_REQUESTED', action: 'Consent requested',
    domain: 'employment', outcome: 'SUCCESS', actor: 'Nadia Rahman', actorId: 'usr-bank', organization: 'Apex Global Bank (Synthetic)',
    organizationId: 'org-apex', targetResourceId: 'cons-2012', metadata: { requestedClaims: ['employer', 'role', 'startDate'], expiresAt: '2026-10-25T23:59:00.000Z' },
    details: 'Apex Global Bank requested three employment claims from Mei Lin Tan for a rental application.',
  },
  {
    id: 'aud-9002', timestamp: '2026-10-02T10:45:00.000Z', eventType: 'CONSENT_GRANTED', action: 'Consent approved',
    domain: 'healthcare', outcome: 'SUCCESS', actor: 'Aarav Mehta', actorId: 'usr-citizen', organization: 'Citizen account',
    organizationId: null, targetResourceId: 'cons-2016', metadata: { approvedClaims: ['vaccine', 'administeredOn'], requestedBy: 'AIIMS (Synthetic)' },
    details: 'Aarav Mehta approved two of two requested immunization claims for AIIMS (Synthetic).',
  },
  {
    id: 'aud-9003', timestamp: '2026-10-01T07:20:00.000Z', eventType: 'VERIFICATION_REQUESTED', action: 'Consent requested',
    domain: 'healthcare', outcome: 'SUCCESS', actor: 'Dr. Rohan Iyer', actorId: 'usr-hospital', organization: 'Meridian Health Network (Synthetic)',
    organizationId: 'org-meridian', targetResourceId: 'cons-2008', metadata: { requestedClaims: ['vaccine', 'administeredOn'] },
    details: 'Meridian Health Network requested a travel health record from Sofia Alvarez.',
  },
  {
    id: 'aud-9004', timestamp: '2026-09-30T08:50:00.000Z', eventType: 'CONSENT_GRANTED', action: 'Consent approved',
    domain: 'education', outcome: 'SUCCESS', actor: 'Daniel Okafor', actorId: 'cit-daniel', organization: 'Citizen account',
    organizationId: null, targetResourceId: 'cons-2009', metadata: { approvedClaims: ['award', 'completionDate'] },
    details: 'Daniel Okafor approved both requested qualification claims.',
  },
  {
    id: 'aud-9005', timestamp: '2026-09-29T11:12:00.000Z', eventType: 'VERIFICATION_REQUESTED', action: 'Consent requested',
    domain: 'employment', outcome: 'SUCCESS', actor: 'Nadia Rahman', actorId: 'usr-bank', organization: 'Apex Global Bank (Synthetic)',
    organizationId: 'org-apex', targetResourceId: 'cons-2001', metadata: { requestedClaims: ['employer', 'role', 'startDate'] },
    details: 'Apex Global Bank requested employment claims from Aarav Mehta for a credit facility application.',
  },
  {
    id: 'aud-9006', timestamp: '2026-09-28T08:45:00.000Z', eventType: 'ORGANIZATION_STATUS_CHANGED', action: 'Trust status suspended',
    domain: 'finance', outcome: 'SUCCESS', actor: 'Priyanka Desai', actorId: 'usr-admin', organization: 'CredLink Network Governance',
    organizationId: 'org-governance', targetResourceId: 'trust-4', metadata: { previousTrustStatus: 'VERIFIED', trustStatus: 'SUSPENDED' },
    details: 'Northbridge Credit Union was suspended in the trust registry pending accreditation review.',
  },
  {
    id: 'aud-9007', timestamp: '2026-09-26T09:15:00.000Z', eventType: 'VERIFICATION_APPROVED', action: 'Verification approved',
    domain: 'employment', outcome: 'SUCCESS', actor: 'Marcus Feld', actorId: 'usr-employer', organization: 'TechCorp Solutions (Synthetic)',
    organizationId: 'org-techcorp', targetResourceId: 'cred-1010', metadata: { consentId: 'cons-2014', allowedClaims: ['role', 'startDate'], mode: 'BASIC_VERIFICATION' },
    details: 'TechCorp Solutions verified an employment record issued by itself; signature, trust and consent checks passed.',
  },
  {
    id: 'aud-9008', timestamp: '2026-09-25T14:05:00.000Z', eventType: 'VERIFICATION_REQUESTED', action: 'Consent requested',
    domain: 'employment', outcome: 'SUCCESS', actor: 'Marcus Feld', actorId: 'usr-employer', organization: 'TechCorp Solutions (Synthetic)',
    organizationId: 'org-techcorp', targetResourceId: 'cons-2014', metadata: { requestedClaims: ['role', 'startDate'] },
    details: 'TechCorp Solutions requested a payroll identity check from Mei Lin Tan.',
  },
  {
    id: 'aud-9009', timestamp: '2026-09-24T15:12:00.000Z', eventType: 'ORGANIZATION_STATUS_CHANGED', action: 'Organization registered',
    domain: 'healthcare', outcome: 'PENDING', actor: 'Unknown requester', actorId: null, organization: 'Meridian Health Network (Synthetic)',
    organizationId: 'org-meridian', targetResourceId: 'org-meridian', metadata: { verificationStatus: 'PENDING', registrationRef: 'HFR-2291887' },
    details: 'Meridian Health Network submitted an organization registration and is awaiting network approval.',
  },
  {
    id: 'aud-9010', timestamp: '2026-09-22T12:40:00.000Z', eventType: 'CONSENT_GRANTED', action: 'Consent approved',
    domain: 'finance', outcome: 'SUCCESS', actor: 'Mei Lin Tan', actorId: 'cit-meilin', organization: 'Citizen account',
    organizationId: null, targetResourceId: 'cons-2007', metadata: { approvedClaims: ['accountHolder', 'statementPeriod'] },
    details: 'Mei Lin Tan approved a bank statement check for a tenancy guarantee.',
  },
  {
    id: 'aud-9011', timestamp: '2026-09-21T09:10:00.000Z', eventType: 'CONSENT_REVOKED', action: 'Consent denied',
    domain: 'education', outcome: 'SUCCESS', actor: 'Sofia Alvarez', actorId: 'cit-sofia', organization: 'Citizen account',
    organizationId: null, targetResourceId: 'cons-2011', metadata: { decision: 'DENIED', failedReason: 'Requested award verification declined by the citizen.' },
    details: 'Sofia Alvarez declined an award verification request. Recorded as CONSENT_REVOKED by the current backend behaviour.',
  },
  {
    id: 'aud-9012', timestamp: '2026-09-19T10:00:00.000Z', eventType: 'CREDENTIAL_ISSUED', action: 'Credential issued',
    domain: 'employment', outcome: 'SUCCESS', actor: 'Marcus Feld', actorId: 'usr-employer', organization: 'TechCorp Solutions (Synthetic)',
    organizationId: 'org-techcorp', targetResourceId: 'cred-1010', metadata: { credentialType: 'EmploymentRecord', subject: 'Mei Lin Tan' },
    details: 'TechCorp Solutions issued an employment record. Proof: Ed25519 JWT signed by the network issuer identity.',
  },
  {
    id: 'aud-9013', timestamp: '2026-09-13T07:30:00.000Z', eventType: 'CONSENT_REVOKED', action: 'Consent denied',
    domain: 'healthcare', outcome: 'SUCCESS', actor: 'Aarav Mehta', actorId: 'usr-citizen', organization: 'Citizen account',
    organizationId: null, targetResourceId: 'cons-2003', metadata: { decision: 'DENIED' },
    details: 'Aarav Mehta declined an immunization disclosure request from Meridian Health Network.',
  },
  {
    id: 'aud-9014', timestamp: '2026-09-12T08:05:00.000Z', eventType: 'VERIFICATION_REQUESTED', action: 'Consent requested',
    domain: 'healthcare', outcome: 'SUCCESS', actor: 'Dr. Rohan Iyer', actorId: 'usr-hospital', organization: 'Meridian Health Network (Synthetic)',
    organizationId: 'org-meridian', targetResourceId: 'cons-2003', metadata: { requestedClaims: ['vaccine', 'doses', 'administeredOn'] },
    details: 'Meridian Health Network requested immunization claims from Aarav Mehta.',
  },
  {
    id: 'aud-9015', timestamp: '2026-09-11T08:20:00.000Z', eventType: 'CONSENT_GRANTED', action: 'Consent approved',
    domain: 'education', outcome: 'SUCCESS', actor: 'Sofia Alvarez', actorId: 'cit-sofia', organization: 'Citizen account',
    organizationId: null, targetResourceId: 'cons-2015', metadata: { approvedClaims: ['programme', 'awardDate'] },
    details: 'Sofia Alvarez approved a transfer credit check for Oxford University (Synthetic).',
  },
  {
    id: 'aud-9016', timestamp: '2026-09-09T14:20:00.000Z', eventType: 'VERIFICATION_APPROVED', action: 'Verification approved',
    domain: 'employment', outcome: 'SUCCESS', actor: 'Nadia Rahman', actorId: 'usr-bank', organization: 'Apex Global Bank (Synthetic)',
    organizationId: 'org-apex', targetResourceId: 'cred-1002', metadata: { consentId: 'cons-2002', mode: 'BANK_VERIFICATION_REQUEST' },
    details: 'Apex Global Bank verified an employment record through consent cons-2002.',
  },
  {
    id: 'aud-9017', timestamp: '2026-09-08T11:40:00.000Z', eventType: 'VERIFICATION_APPROVED', action: 'Verification rejected',
    domain: 'finance', outcome: 'FAILURE', actor: 'Nadia Rahman', actorId: 'usr-bank', organization: 'Apex Global Bank (Synthetic)',
    organizationId: 'org-apex', targetResourceId: 'cred-1009',
    metadata: { verificationResult: 'REJECTED', failureReason: 'Issuer trust status is SUSPENDED.', trustStatus: 'SUSPENDED' },
    details: 'Verification of a Northbridge Credit Union statement was rejected because the issuer is suspended in the trust registry.',
  },
  {
    id: 'aud-9018', timestamp: '2026-08-20T13:05:00.000Z', eventType: 'VERIFICATION_APPROVED', action: 'Verification approved',
    domain: 'education', outcome: 'SUCCESS', actor: 'Nadia Rahman', actorId: 'usr-bank', organization: 'Apex Global Bank (Synthetic)',
    organizationId: 'org-apex', targetResourceId: 'cred-1005', metadata: { consentId: 'cons-2004', consentState: 'CONSUMED' },
    details: 'Apex Global Bank verified a degree; the consent was consumed and is now stored as EXPIRED.',
  },
  {
    id: 'aud-9019', timestamp: '2026-06-01T09:25:00.000Z', eventType: 'CONSENT_REVOKED', action: 'Consent withdrawn',
    domain: 'employment', outcome: 'SUCCESS', actor: 'Daniel Okafor', actorId: 'cit-daniel', organization: 'Citizen account',
    organizationId: null, targetResourceId: 'cons-2006', metadata: { previousStatus: 'APPROVED', decision: 'REVOKED' },
    details: 'Daniel Okafor withdrew previously granted employment access.',
  },
  {
    id: 'aud-9020', timestamp: '2026-06-01T09:20:00.000Z', eventType: 'CREDENTIAL_REVOKED', action: 'Credential revoked',
    domain: 'employment', outcome: 'SUCCESS', actor: 'Marcus Feld', actorId: 'usr-employer', organization: 'TechCorp Solutions (Synthetic)',
    organizationId: 'org-techcorp', targetResourceId: 'cred-1007',
    metadata: { reason: 'Employment ended 2 May 2025. Record superseded by a final settlement statement.' },
    details: 'TechCorp Solutions revoked an employment record. The reason is stored on this audit event.',
  },
  {
    id: 'aud-9021', timestamp: '2026-04-02T10:10:00.000Z', eventType: 'ORGANIZATION_STATUS_CHANGED', action: 'Trust status revoked',
    domain: 'education', outcome: 'SUCCESS', actor: 'Priyanka Desai', actorId: 'usr-admin', organization: 'CredLink Network Governance',
    organizationId: 'org-governance', targetResourceId: 'trust-5', metadata: { previousTrustStatus: 'SUSPENDED', trustStatus: 'REVOKED' },
    details: 'Cascade Institute lost network trust and its registration was declined.',
  },
  {
    id: 'aud-9022', timestamp: '2026-04-10T10:20:00.000Z', eventType: 'CREDENTIAL_ISSUED', action: 'Credential issued',
    domain: 'finance', outcome: 'SUCCESS', actor: 'Elena Kovacs', actorId: 'usr-northbridge', organization: 'Northbridge Credit Union (Synthetic)',
    organizationId: 'org-northbridge', targetResourceId: 'cred-1004', metadata: { credentialType: 'IncomeStatement', subject: 'Aarav Mehta' },
    details: 'Northbridge Credit Union issued an income statement before its trust status was suspended.',
  },
];
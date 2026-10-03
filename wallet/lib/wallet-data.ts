export const student = {
  name: 'Aarav Sharma',
  firstName: 'Aarav',
  initials: 'AS',
}

export const college = {
  name: 'National Institute of Technology',
  abbreviation: 'NIT',
}

export const bank = {
  name: 'Apex Imperial Bank',
  division: 'Graduate Banking Services',
}

export const CREDENTIAL_STATUS = 'Valid & Active'
export const GRADUATION_YEAR = '2025'
export const ISSUANCE_DATE = '2025-06-20'
export const ISSUER_DID = 'did:key:zNITCredLinkIssuer'
export const DOMAIN = 'COLLEGE'

export type Claim = { label: string; value: string }

export type Credential = {
  id: string
  title: string
  subtitle?: string
  fullTitle: string
  claims: Claim[]
  technical: Claim[]
}

const degreeName = 'Bachelor of Science (Computer Engineering)'

export const credentials: Credential[] = [
  {
    id: 'bsc',
    title: 'Bachelor of Science',
    subtitle: 'Computer Engineering',
    fullTitle: degreeName,
    claims: [
      { label: 'Holder', value: student.name },
      { label: 'Degree Name', value: degreeName },
      { label: 'Institution', value: college.name },
      { label: 'Graduation Year', value: GRADUATION_YEAR },
      { label: 'Domain', value: DOMAIN },
      { label: 'Issuance Date', value: ISSUANCE_DATE },
    ],
    technical: [
      { label: 'Credential ID', value: 'CL-NIT-AARAV-2025-001' },
      { label: 'Issuer DID', value: ISSUER_DID },
      { label: 'Status', value: CREDENTIAL_STATUS },
    ],
  },
  {
    id: 'transcript',
    title: 'Academic Transcript Attestation',
    fullTitle: 'Academic Transcript Attestation',
    claims: [
      { label: 'Holder', value: student.name },
      { label: 'Attestation', value: 'Official academic transcript on record' },
      { label: 'Institution', value: college.name },
      { label: 'Graduation Year', value: GRADUATION_YEAR },
      { label: 'Domain', value: DOMAIN },
      { label: 'Issuance Date', value: ISSUANCE_DATE },
    ],
    technical: [
      { label: 'Credential ID', value: 'CL-NIT-AARAV-2025-002' },
      { label: 'Issuer DID', value: ISSUER_DID },
      { label: 'Status', value: CREDENTIAL_STATUS },
    ],
  },
]

export const consentRequest = {
  purpose: 'Graduate Banking / Loan Eligibility Pre-check',
  requestType: 'One-time request',
  expiresInSeconds: 4 * 60 + 32,
}

export const requestedClaims = ['Degree Name', 'Institution Name', 'Graduation Year', 'Credential Status']

export const notRequestedClaims = [
  'Full Academic Transcript',
  'Individual Subject Marks',
  'CGPA',
  'Home Address',
  'Government ID',
  'Other Credentials',
]

export type ActivityStatus = 'Completed' | 'Active' | 'Expired'

export type Activity = {
  id: string
  requester: string
  purpose: string
  result?: string
  sharedSummary: string
  access: string
  status: ActivityStatus
  date: string
  shared: string[]
  notShared: string[]
}

export const activities: Activity[] = [
  {
    id: 'apex',
    requester: bank.name,
    purpose: consentRequest.purpose,
    result: 'Verified & Approved',
    sharedSummary: 'Degree Name, Institution, Graduation Year, Credential Status',
    access: 'One-time',
    status: 'Completed',
    date: 'Today, 12:30 PM',
    shared: ['Degree Name', 'Institution', 'Graduation Year', 'Credential Status'],
    notShared: ['Transcript', 'Marks', 'CGPA', 'Address', 'Government ID'],
  },
  {
    id: 'fsf',
    requester: 'Future Scholars Foundation',
    purpose: 'Postgraduate Scholarship Eligibility',
    sharedSummary: 'Degree Name, Graduation Year',
    access: 'One-time',
    status: 'Expired',
    date: '2025-07-02',
    shared: ['Degree Name', 'Graduation Year'],
    notShared: ['Transcript', 'Marks', 'CGPA', 'Address', 'Government ID'],
  },
]

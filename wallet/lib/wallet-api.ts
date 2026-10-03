export type WalletUser = {
  id: string
  email: string
  fullName: string
  phone?: string | null
  role: string
  status: string
}

export type WalletCredential = {
  id: string
  subjectId: string
  issuerOrgId: string
  issuer?: { id: string; name: string; code?: string; did?: string } | null
  domain: string
  credentialType: string
  title: string
  claims: Record<string, unknown> | Array<{ key?: string; label?: string; value?: unknown }>
  issuanceDate: string
  expirationDate?: string | null
  status: 'VALID' | 'REVOKED' | 'EXPIRED'
  createdAt?: string
}

export type WalletConsent = {
  id: string
  citizenId: string
  requestingOrgId: string
  requestingOrg?: { id: string; name: string; code?: string } | null
  credentialId?: string | null
  credential?: { id: string; title: string; credentialType: string; status: string } | null
  domain: string
  purpose: string
  requestedClaims: string[]
  approvedClaims: string[]
  status: 'PENDING' | 'APPROVED' | 'DENIED' | 'REVOKED' | 'EXPIRED'
  grantedAt?: string | null
  expiresAt?: string | null
  createdAt: string
  updatedAt?: string
}

export type ResolvedConsentRequest = {
  id: string
  status: string
  alreadyProcessed: boolean
  eligibility?: {
    isEligible: boolean
    reason?: string
    matchedCredential?: {
      id: string
      title: string
      credentialType: string
      status: string
      claims: string[]
    } | null
    availableClaims: string[]
    missingClaims: string[]
  }
  requestingOrg: { id: string; name: string; code: string; domain?: string } | null
  credential: { id: string; title: string; credentialType: string; status: string } | null
  domain: string
  purpose: string
  requestedClaims: string[]
  expiresAt: string | null
  createdAt: string
  qrType: 'consent_request'
}

type ApiEnvelope<T> = {
  success: boolean
  data?: T
  error?: string
  message?: string
}

type LoginData = {
  user: WalletUser
  session: { access_token: string; refresh_token: string }
}

function apiBaseUrl(): string {
  const configured = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_PRODUCTION_URL
  if (configured) return configured.replace(/\/+$/, '')
  if (typeof window !== 'undefined' && ['localhost', '127.0.0.1'].includes(window.location.hostname)) {
    return 'http://localhost:5000'
  }
  return 'https://credlink-20-production.up.railway.app'
}

const ACCESS_TOKEN_KEY = 'credlink_auth_token'
const REFRESH_TOKEN_KEY = 'credlink_refresh_token'

function readToken(key: string): string | null {
  return typeof window === 'undefined' ? null : window.localStorage.getItem(key)
}

function saveSession(accessToken: string, refreshToken: string) {
  window.localStorage.setItem(ACCESS_TOKEN_KEY, accessToken)
  window.localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
}

export function clearWalletSession() {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(ACCESS_TOKEN_KEY)
  window.localStorage.removeItem(REFRESH_TOKEN_KEY)
}

async function readResponse<T>(response: Response): Promise<T> {
  let body: ApiEnvelope<T>
  try {
    body = (await response.json()) as ApiEnvelope<T>
  } catch {
    throw new Error(`The backend returned an invalid response (${response.status}).`)
  }
  if (!response.ok || body.success === false) {
    throw new Error(body.error || body.message || `Backend request failed (${response.status}).`)
  }
  if (body.data === undefined) throw new Error('The backend response did not include data.')
  return body.data
}

let refreshInFlight: Promise<string | null> | null = null

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = readToken(REFRESH_TOKEN_KEY)
  if (!refreshToken) return null
  if (refreshInFlight) return refreshInFlight

  refreshInFlight = (async () => {
    const response = await fetch(`${apiBaseUrl()}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ refreshToken }),
    })
    const data = await readResponse<LoginData>(response)
    if (!data.session?.access_token || !data.session?.refresh_token) {
      throw new Error('The backend did not return a refreshed session.')
    }
    saveSession(data.session.access_token, data.session.refresh_token)
    return data.session.access_token
  })()

  try {
    return await refreshInFlight
  } catch {
    clearWalletSession()
    return null
  } finally {
    refreshInFlight = null
  }
}

async function request<T>(path: string, init: RequestInit = {}, canRefresh = true): Promise<T> {
  const accessToken = readToken(ACCESS_TOKEN_KEY)
  const headers = new Headers(init.headers)
  headers.set('Accept', 'application/json')
  if (init.body) headers.set('Content-Type', 'application/json')
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`)

  let response: Response
  try {
    response = await fetch(`${apiBaseUrl()}${path}`, { ...init, headers, cache: 'no-store' })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Network request failed.'
    throw new Error(`Could not reach the CredLink backend. ${message}`)
  }

  if (response.status === 401 && canRefresh) {
    const refreshedToken = await refreshAccessToken()
    if (refreshedToken) return request<T>(path, init, false)
  }

  return readResponse<T>(response)
}

export async function loginWallet(email: string, password: string): Promise<WalletUser> {
  const response = await fetch(`${apiBaseUrl()}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ email, password }),
    cache: 'no-store',
  })
  const data = await readResponse<LoginData>(response)
  if (!data.session?.access_token || !data.session?.refresh_token || !data.user) {
    throw new Error('The backend did not return a complete login session.')
  }
  if (data.user.role !== 'CITIZEN') {
    clearWalletSession()
    throw new Error('The wallet is for citizen accounts. Please sign in with a citizen account.')
  }
  saveSession(data.session.access_token, data.session.refresh_token)
  return data.user
}

export async function getWalletUser(): Promise<WalletUser> {
  const data = await request<{ user: WalletUser }>('/api/auth/me')
  if (!data.user) throw new Error('The backend did not return your profile.')
  if (data.user.role !== 'CITIZEN') {
    clearWalletSession()
    throw new Error('This wallet is available to citizen accounts only.')
  }
  return data.user
}

export async function fetchWalletCredentials(citizenId: string): Promise<WalletCredential[]> {
  const query = new URLSearchParams({ limit: '50', subjectId: citizenId })
  const data = await request<{ credentials: WalletCredential[] }>(`/api/credentials?${query}`)
  return data.credentials
}

export async function fetchWalletConsents(citizenId: string): Promise<WalletConsent[]> {
  const query = new URLSearchParams({ limit: '50', citizenId })
  const data = await request<{ consents: WalletConsent[] }>(`/api/consents?${query}`)
  return data.consents
}

export async function resolveWalletQr(payload: string): Promise<ResolvedConsentRequest> {
  const data = await request<ResolvedConsentRequest>('/api/qr/resolve', {
    method: 'POST',
    body: JSON.stringify({ payload }),
  })
  if (data.qrType !== 'consent_request' || !data.id) {
    throw new Error('This QR code is not a CredLink consent request.')
  }
  return data
}

export async function respondToConsent(
  id: string,
  action: 'APPROVE' | 'DENY',
  approvedClaims: string[],
): Promise<WalletConsent> {
  return request<WalletConsent>(`/api/consents/${encodeURIComponent(id)}/respond`, {
    method: 'POST',
    body: JSON.stringify({ action, approvedClaims }),
  })
}

export async function logoutWallet(): Promise<void> {
  try {
    const token = readToken(ACCESS_TOKEN_KEY)
    if (!token) return
    const response = await fetch(`${apiBaseUrl()}/api/auth/logout`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      cache: 'no-store',
    })
    if (!response.ok) {
      let body: ApiEnvelope<unknown> = { success: false }
      try { body = (await response.json()) as ApiEnvelope<unknown> } catch { /* Preserve the HTTP status below. */ }
      throw new Error(body.error || body.message || `Backend logout failed (${response.status}).`)
    }
  } finally {
    clearWalletSession()
  }
}

export function getWalletAccessToken(): string | null {
  return readToken(ACCESS_TOKEN_KEY)
}

export const walletRealtimeConfig = {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL,
  publishableKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
}

import type { WalletCredential } from './wallet-api'

export function credentialClaims(credential: WalletCredential): Array<{ label: string; value: string }> {
  if (Array.isArray(credential.claims)) {
    return credential.claims.map((claim) => ({
      label: claim.label || claim.key || 'Claim',
      value: formatValue(claim.value),
    }))
  }
  return Object.entries(credential.claims || {}).map(([label, value]) => ({
    label,
    value: formatValue(value),
  }))
}

function formatValue(value: unknown): string {
  if (typeof value === 'string') return value
  if (value == null) return ''
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  return JSON.stringify(value)
}

export function formatDate(value?: string | null): string {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(date)
}

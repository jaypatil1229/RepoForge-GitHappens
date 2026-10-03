import type { CredentialRecord } from '@/lib/types';

export interface ClaimEntry {
  key: string;
  label: string;
  value: string;
}

const LABEL_OVERRIDES: Record<string, string> = {
  id: 'ID',
  gpa: 'GPA',
  cgpa: 'CGPA',
  pan: 'PAN',
  kyc: 'KYC',
  dob: 'Date of birth',
  vat: 'Tax identifier',
  ifsc: 'IFSC code',
  employeeId: 'Employee ID',
  fieldOfStudy: 'Field of study',
  npi: 'Provider number',
  url: 'Reference link',
  verified: 'Verified',
};

/** Turns snake_case or camelCase keys into short title-cased labels. */
export function claimLabel(key: string): string {
  const override = LABEL_OVERRIDES[key] ?? LABEL_OVERRIDES[key.toLowerCase()];
  if (override) return override;
  const spaced = key
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim();
  if (!spaced) return key;
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

export function claimValue(value: unknown): string {
  if (value === null || value === undefined || value === '') return 'Not provided';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (Array.isArray(value)) return value.map((item) => claimValue(item)).join(', ');
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
  return String(value);
}

export function claimEntries(
  claims: CredentialRecord['claims'] | Record<string, unknown> | unknown[] | null | undefined,
): ClaimEntry[] {
  if (!claims) return [];
  if (Array.isArray(claims)) {
    return claims.map((value, index) => ({
      key: String(index),
      label: claimLabel(String(index)),
      value: claimValue(value),
    }));
  }
  return Object.entries(claims as Record<string, unknown>).map(([key, value]) => ({
    key,
    label: claimLabel(key),
    value: claimValue(value),
  }));
}

export function claimKeys(
  claims: CredentialRecord['claims'] | Record<string, unknown> | unknown[] | null | undefined,
): string[] {
  if (!claims) return [];
  if (Array.isArray(claims)) return claims.map((_value, index) => String(index));
  return Object.keys(claims as Record<string, unknown>);
}

/** A stable display value for a claim key when no record is available. */
export function claimLabelsFor(claims: unknown, keys: string[]): string[] {
  const entries = claimEntries(claims as never);
  const byKey = new Map(entries.map((entry) => [entry.key, entry.label]));
  return keys.map((key) => byKey.get(key) ?? claimLabel(key));
}
import type { ConsentStatus, CredentialStatus, OrgVerificationStatus, TrustStatus } from '@/lib/types';

const DATE_TIME = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
  timeZone: 'UTC',
});

const DATE_ONLY = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
});

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return 'Not recorded';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not recorded';
  return DATE_TIME.format(date);
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return 'No expiry';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'No expiry';
  return DATE_ONLY.format(date);
}

/** Short, stable relative phrasing anchored to an explicit "now" so demo output never drifts. */
export function formatRelative(value: string | null | undefined, now: Date): string {
  if (!value) return 'Not recorded';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not recorded';
  const diffMs = date.getTime() - now.getTime();
  const past = diffMs < 0;
  const abs = Math.abs(diffMs);
  const minutes = Math.round(abs / 60_000);
  const hours = Math.round(abs / 3_600_000);
  const days = Math.round(abs / 86_400_000);

  let phrase: string;
  if (minutes < 2) phrase = 'a moment';
  else if (minutes < 60) phrase = `${minutes} minutes`;
  else if (hours < 24) phrase = `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
  else if (days < 31) phrase = `${days} ${days === 1 ? 'day' : 'days'}`;
  else {
    const months = Math.round(days / 30);
    if (months < 12) phrase = `${months} ${months === 1 ? 'month' : 'months'}`;
    else {
      const years = Math.round(days / 365);
      phrase = `${years} ${years === 1 ? 'year' : 'years'}`;
    }
  }
  if (phrase === 'a moment') return 'Just now';
  return past ? `${phrase} ago` : `In ${phrase}`;
}

/** Identifiers are long; show a legible head and tail without hiding that it is truncated. */
export function truncateId(value: string | null | undefined, head = 8, tail = 4): string {
  if (!value) return 'Not assigned';
  if (value.length <= head + tail + 1) return value;
  return `${value.slice(0, head)}\u2026${value.slice(-tail)}`;
}

export function displayName(value: string | null | undefined): string {
  return value && value.trim().length > 0 ? value : 'Unnamed record';
}

export type ToneKey = 'neutral' | 'positive' | 'warning' | 'danger' | 'info' | 'brand';

export const credentialStatusTone: Record<CredentialStatus, ToneKey> = {
  VALID: 'positive',
  REVOKED: 'danger',
  EXPIRED: 'warning',
};

export const credentialStatusLabel: Record<CredentialStatus, string> = {
  VALID: 'Active',
  REVOKED: 'Revoked',
  EXPIRED: 'Expired',
};

export const consentStatusTone: Record<ConsentStatus, ToneKey> = {
  PENDING: 'warning',
  APPROVED: 'positive',
  DENIED: 'neutral',
  REVOKED: 'danger',
  EXPIRED: 'neutral',
};

export const consentStatusLabel: Record<ConsentStatus, string> = {
  PENDING: 'Awaiting decision',
  APPROVED: 'Shared',
  DENIED: 'Declined',
  REVOKED: 'Withdrawn',
  EXPIRED: 'No longer usable',
};

export const trustStatusTone: Record<TrustStatus, ToneKey> = {
  VERIFIED: 'positive',
  SUSPENDED: 'warning',
  REVOKED: 'danger',
};

export const orgStatusTone: Record<OrgVerificationStatus, ToneKey> = {
  APPROVED: 'positive',
  PENDING: 'warning',
  DENIED: 'danger',
};

export const orgStatusLabel: Record<OrgVerificationStatus, string> = {
  APPROVED: 'Approved',
  PENDING: 'Awaiting network approval',
  DENIED: 'Declined',
};
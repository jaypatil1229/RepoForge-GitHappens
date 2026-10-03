import type { AccountRole } from '@/lib/types';

export interface PortalNavItem {
  href: string;
  label: string;
  /** Hrefs that should also mark this item active. */
  also?: string[];
  roles: AccountRole[];
  group: 'workspace' | 'network' | 'account';
  description: string;
}

const ALL: AccountRole[] = ['CITIZEN', 'COLLEGE', 'BANK', 'HOSPITAL', 'EMPLOYER', 'ADMIN'];
const INSTITUTIONS: AccountRole[] = ['COLLEGE', 'BANK', 'HOSPITAL', 'EMPLOYER'];

export const portalNav: PortalNavItem[] = [
  {
    href: '/portal',
    label: 'Overview',
    roles: ALL,
    group: 'workspace',
    description: 'What needs attention and what changed recently.',
  },
  {
    href: '/portal/credentials',
    label: 'Credentials',
    also: ['/portal/credentials/new'],
    roles: ALL,
    group: 'workspace',
    description: 'Records held, issued or visible through consent.',
  },
  {
    href: '/portal/verification',
    label: 'Verification',
    also: ['/portal/verification/new'],
    roles: ALL,
    group: 'workspace',
    description: 'Requests, decisions and verification results.',
  },
  {
    href: '/portal/issuers',
    label: 'Issuers',
    roles: ALL,
    group: 'network',
    description: 'Which institutions can attest which records.',
  },
  {
    href: '/portal/trust-registry',
    label: 'Trust registry',
    roles: ['ADMIN'],
    group: 'network',
    description: 'Network trust status for each issuer.',
  },
  {
    href: '/portal/organizations',
    label: 'Organizations',
    roles: ['ADMIN'],
    group: 'network',
    description: 'Approve institutions and grant issuer authorization.',
  },
  {
    href: '/portal/audit',
    label: 'Audit trail',
    roles: ALL,
    group: 'network',
    description: 'Every recorded decision and outcome.',
  },
  {
    href: '/portal/profile',
    label: 'Profile',
    roles: ALL,
    group: 'account',
    description: 'Your name, email and contact number.',
  },
];

export function navForRole(role: AccountRole | null): PortalNavItem[] {
  if (!role) return [];
  return portalNav.filter((item) => item.roles.includes(role));
}

/** Sidebar label adjustments so a citizen never reads institution language. */
export function navLabel(item: PortalNavItem, role: AccountRole | null): string {
  if (role === 'CITIZEN') {
    if (item.href === '/portal/credentials') return 'My records';
    if (item.href === '/portal/verification') return 'Sharing requests';
  }
  if (item.href === '/portal/credentials' && role === 'ADMIN') return 'All credentials';
  if (item.href === '/portal/verification' && role === 'ADMIN') return 'All requests';
  return item.label;
}

export const roleLabel: Record<AccountRole, string> = {
  CITIZEN: 'Citizen',
  COLLEGE: 'College',
  BANK: 'Bank',
  HOSPITAL: 'Hospital',
  EMPLOYER: 'Employer',
  ADMIN: 'Network administrator',
};

export { INSTITUTIONS };
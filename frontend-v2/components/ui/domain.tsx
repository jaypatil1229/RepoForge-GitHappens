import { Briefcase, GraduationCap, HeartPulse, Landmark, Network } from 'lucide-react';

import { cn } from '@/lib/utils';
import type { CredentialDomain, OrgDomain } from '@/lib/types';

export const credentialDomainLabel: Record<CredentialDomain, string> = {
  education: 'Education',
  employment: 'Employment',
  finance: 'Finance',
  healthcare: 'Healthcare',
};

export const orgDomainLabel: Record<OrgDomain, string> = {
  college: 'Education',
  employer: 'Employment',
  bank: 'Finance',
  hospital: 'Healthcare',
  network_admin: 'Network',
};

const credentialDomainIcon: Record<CredentialDomain, typeof GraduationCap> = {
  education: GraduationCap,
  employment: Briefcase,
  finance: Landmark,
  healthcare: HeartPulse,
};

const orgDomainIcon: Record<OrgDomain, typeof GraduationCap> = {
  college: GraduationCap,
  employer: Briefcase,
  bank: Landmark,
  hospital: HeartPulse,
  network_admin: Network,
};

export function DomainMark({
  domain,
  variant = 'credential',
  className,
}: {
  domain: string | null;
  variant?: 'credential' | 'organization';
  className?: string;
}) {
  if (!domain) return null;
  const isCredential = variant === 'credential';
  const Icon = isCredential
    ? credentialDomainIcon[domain as CredentialDomain] ?? GraduationCap
    : orgDomainIcon[domain as OrgDomain] ?? Network;
  const label = isCredential
    ? credentialDomainLabel[domain as CredentialDomain] ?? domain
    : orgDomainLabel[domain as OrgDomain] ?? domain;

  return (
    <span className={cn('inline-flex items-center gap-1.5 text-micro font-medium text-ink-600', className)}>
      <Icon aria-hidden className="size-3.5 text-ink-500" strokeWidth={1.75} />
      {label}
    </span>
  );
}
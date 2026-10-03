import type { Metadata } from 'next';

import { MarketingShell } from '@/components/marketing/marketing-shell';
import { Hero } from '@/components/marketing/hero';
import { Fragmentation } from '@/components/marketing/fragmentation';
import { Lifecycle } from '@/components/marketing/lifecycle';
import { Consent } from '@/components/marketing/consent';
import { Verification } from '@/components/marketing/verification';
import { Invitation } from '@/components/marketing/invitation';

export const metadata: Metadata = {
  title: 'CredLink — proof that moves with you',
  description:
    'Institutions issue verifiable credentials, people decide which claims to share, and recipients verify the proof behind them.',
};

export default function RootLandingPage() {
  return (
    <MarketingShell>
      <Hero />
      <Fragmentation />
      <Lifecycle />
      <Consent />
      <Verification />
      <Invitation />
    </MarketingShell>
  );
}

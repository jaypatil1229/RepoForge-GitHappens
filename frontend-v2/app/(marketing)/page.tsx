import type { Metadata } from 'next';

import { Consent } from '@/components/marketing/consent';
import { Fragmentation } from '@/components/marketing/fragmentation';
import { Hero } from '@/components/marketing/hero';
import { Invitation } from '@/components/marketing/invitation';
import { Lifecycle } from '@/components/marketing/lifecycle';
import { Verification } from '@/components/marketing/verification';

export const metadata: Metadata = {
  title: 'CredLink — proof that moves with you',
  description:
    'Institutions issue verifiable credentials, people decide which claims to share, and recipients verify the proof behind them.',
};

export default function HomePage() {
  return (
    <>
      <Hero />
      <Fragmentation />
      <Lifecycle />
      <Consent />
      <Verification />
      <Invitation />
    </>
  );
}
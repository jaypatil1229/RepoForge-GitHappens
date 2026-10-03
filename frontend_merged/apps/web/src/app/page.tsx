import React from 'react';
import { LandingNavbar } from '../components/landing/LandingNavbar';
import { LandingHero } from '../components/landing/LandingHero';
import { LifeStageNetwork } from '../components/landing/LifeStageNetwork';
import { HowItWorks } from '../components/landing/HowItWorks';
import { CitizenBenefits } from '../components/landing/CitizenBenefits';
import { InstitutionDomains } from '../components/landing/InstitutionDomains';
import { LandingFooter } from '../components/landing/LandingFooter';

export default function RootLandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#090D16] text-slate-900 dark:text-slate-100 flex flex-col antialiased">
      <LandingNavbar />
      <main className="flex-1">
        <LandingHero />
        <LifeStageNetwork />
        <HowItWorks />
        <CitizenBenefits />
        <InstitutionDomains />
      </main>
      <LandingFooter />
    </div>
  );
}

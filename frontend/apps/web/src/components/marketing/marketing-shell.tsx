import React from 'react';
import { SiteFooter } from './site-footer';
import { SiteHeader } from './site-header';

export function MarketingShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-paper-0 text-ink-950 font-sans">
      <SiteHeader />
      <main id="main" className="flex-1">
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}

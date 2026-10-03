'use client';

import React from 'react';
import { FileCheck, ShieldCheck, UserCheck, ArrowRight, Lock } from 'lucide-react';
import { Card, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';

export function HowItWorks() {
  const steps = [
    {
      step: '01',
      title: 'ISSUE',
      subtitle: 'Authorized Attestation',
      icon: <FileCheck className="w-5 h-5 text-forest-800 dark:text-sage-500" />,
      description: 'An authorized institution (College, Hospital, Employer, or Bank) verifies its records and issues a signed verifiable credential to the citizen.',
      detail: 'Includes issuer DID, authorized schema, and cryptographic proof.'
    },
    {
      step: '02',
      title: 'CONSENT',
      subtitle: 'Purpose-Bound Control',
      icon: <UserCheck className="w-5 h-5 text-forest-800 dark:text-sage-500" />,
      description: 'A verifier submits a request stating its purpose and requested claims. The citizen reviews the request and grants explicit selective disclosure consent.',
      detail: 'Citizen can approve required claims while withholding unnecessary data.'
    },
    {
      step: '03',
      title: 'VERIFY',
      subtitle: 'Trust & Integrity Check',
      icon: <ShieldCheck className="w-5 h-5 text-forest-800 dark:text-sage-500" />,
      description: 'The verifying institution checks credential integrity, issuer status in the Root Trust Registry, and approved claims without accessing full raw records.',
      detail: 'Verification succeeds only if issuer is active and proof is intact.'
    }
  ];

  return (
    <section id="how-it-works" className="py-16 md:py-24 border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-[#090D16]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto space-y-3 mb-12">
          <Badge variant="sage" className="px-3 py-1 text-xs">
            Core Network Protocol
          </Badge>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            How CredLink Operates
          </h2>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
            A three-step architecture separating record issuance, citizen consent, and verifier validation.
          </p>
        </div>

        {/* 3 Steps Timeline Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {steps.map((item, index) => (
            <Card key={item.step} className="relative p-6 space-y-4 bg-white dark:bg-slate-900">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-forest-800 dark:text-sage-500 font-mono">
                  {item.step}
                </span>
                <div className="p-2.5 rounded-lg bg-forest-50 dark:bg-forest-900/50 border border-forest-100 dark:border-forest-800">
                  {item.icon}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  {item.title}
                </h3>
                <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 mt-0.5">{item.subtitle}</p>
              </div>

              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {item.description}
              </p>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{item.detail}</span>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

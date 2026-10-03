'use client';

import React from 'react';
import { ShieldCheck, UserCheck, RefreshCw, FileText, Lock, EyeOff } from 'lucide-react';
import { Card, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';

export function CitizenBenefits() {
  const benefits = [
    {
      title: 'Zero Repeated Manual Verification',
      desc: 'Avoid requesting paper transcripts or visiting offices repeatedly when applying to jobs or banks.',
      icon: <RefreshCw className="w-5 h-5 text-forest-800 dark:text-sage-500" />
    },
    {
      title: 'Selective Disclosure Privacy',
      desc: 'Disclose specific required claims (e.g. "Over 21", "Active Employee") without revealing full private history.',
      icon: <EyeOff className="w-5 h-5 text-forest-800 dark:text-sage-500" />
    },
    {
      title: 'Purpose-Bound Sharing Consent',
      desc: 'Verifiers must declare why data is needed. Citizens grant explicit consent before records are shared.',
      icon: <UserCheck className="w-5 h-5 text-forest-800 dark:text-sage-500" />
    },
    {
      title: 'Unified Life-Stage Ownership',
      desc: 'Keep all your verified records—from academic degrees to healthcare immunizations—in one digital identity wallet.',
      icon: <ShieldCheck className="w-5 h-5 text-forest-800 dark:text-sage-500" />
    }
  ];

  return (
    <section id="for-citizens" className="py-16 md:py-24 border-b border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column Text */}
          <div className="lg:col-span-5 space-y-4">
            <Badge variant="sage" className="px-3 py-1 text-xs">
              Citizen-Centric Design
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              Empowering Citizens with True Record Control
            </h2>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
              Traditional identity systems lock your information inside institutional silos. CredLink gives citizens portable, verifiable records with full control over disclosure.
            </p>
            <div className="p-4 bg-forest-50 dark:bg-forest-900/40 border border-forest-100 dark:border-forest-800 rounded-xl text-xs sm:text-sm text-forest-900 dark:text-forest-100 font-medium">
              "You own your credentials. Verifiers only see what you explicitly approve for their requested purpose."
            </div>
          </div>

          {/* Right Column Grid */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {benefits.map((b) => (
              <Card key={b.title} className="p-5 space-y-2.5">
                <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 w-fit">
                  {b.icon}
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">{b.title}</h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{b.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

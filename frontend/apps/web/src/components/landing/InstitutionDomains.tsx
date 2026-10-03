'use client';

import React from 'react';
import Link from 'next/link';
import { Building2, Shield, ArrowRight, GraduationCap, Briefcase, Landmark, HeartPulse } from 'lucide-react';
import { Card, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

export function InstitutionDomains() {
  const categories = [
    {
      domain: 'Education Institutions',
      role: 'COLLEGE',
      icon: <GraduationCap className="w-5 h-5 text-blue-600 dark:text-blue-400" />,
      desc: 'Issue degrees, academic transcripts, and student enrollment records.'
    },
    {
      domain: 'Employers & Enterprise',
      role: 'EMPLOYER',
      icon: <Briefcase className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />,
      desc: 'Issue work history certificates, verify candidate qualifications, and issue conduct attestations.'
    },
    {
      domain: 'Banks & Financial Inst.',
      role: 'BANK',
      icon: <Landmark className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
      desc: 'Perform selective KYC checks, income attestations, and credit standing verifications.'
    },
    {
      domain: 'Hospitals & Healthcare',
      role: 'HOSPITAL',
      icon: <HeartPulse className="w-5 h-5 text-teal-600 dark:text-teal-400" />,
      desc: 'Issue immunization certificates and insurance eligibility with privacy disclosure markers.'
    },
    {
      domain: 'Network Governance',
      role: 'ADMIN',
      icon: <Shield className="w-5 h-5 text-forest-800 dark:text-sage-500" />,
      desc: 'Root Trust Registry, issuer authorization management, DID directory, and system audit logs.'
    }
  ];

  return (
    <section id="for-institutions" className="py-16 md:py-24 border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-[#090D16]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto space-y-3 mb-12">
          <Badge variant="sage" className="px-3 py-1 text-xs">
            Institutional Integration
          </Badge>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Built for Authorized Institutions
          </h2>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
            Institutions operate within their permitted credential domains while sharing verifiable trust across the network.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((c) => (
            <Card key={c.domain} className="p-5 space-y-3 bg-white dark:bg-slate-900 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800">
                    {c.icon}
                  </div>
                  <Badge variant="neutral" className="text-xs">
                    {c.role}
                  </Badge>
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">{c.domain}</h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{c.desc}</p>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                <Link href="/login">
                  <span className="text-sm font-semibold text-forest-800 dark:text-sage-400 hover:underline inline-flex items-center gap-1">
                    Access Portal <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

'use client';

import React from 'react';
import { GraduationCap, Briefcase, Landmark, HeartPulse, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';

export function LifeStageNetwork() {
  const domains = [
    {
      id: 'education',
      title: '1. Education',
      subtitle: 'Colleges & Universities',
      badge: 'Academic Realm',
      badgeColor: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300',
      icon: <GraduationCap className="w-6 h-6 text-blue-600 dark:text-blue-400" />,
      description: 'Institutions issue tamper-proof academic degrees, student enrollment IDs, and transcript attestations.',
      examples: ['Bachelor of Science Degree', 'Academic Transcript Attestation', 'Student Enrollment Certificate']
    },
    {
      id: 'employment',
      title: '2. Employment',
      subtitle: 'Employers & Enterprise',
      badge: 'Workplace Realm',
      badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-300',
      icon: <Briefcase className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />,
      description: 'Employers issue work history credentials, verified seniority roles, and background attestations.',
      examples: ['Senior Role Certificate', 'Employment Verification', 'Conduct Clearance Certificate']
    },
    {
      id: 'finance',
      title: '3. Finance',
      subtitle: 'Banks & Financial Inst.',
      badge: 'Financial Realm',
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300',
      icon: <Landmark className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />,
      description: 'Banks request selective disclosure for KYC, income verification, and credit eligibility.',
      examples: ['KYC Compliance Attestation', 'Income Attestation', 'Credit Standing Certificate']
    },
    {
      id: 'healthcare',
      title: '4. Healthcare',
      subtitle: 'Hospitals & Healthcare Providers',
      badge: 'Healthcare Realm (Core)',
      badgeColor: 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/50 dark:text-teal-300',
      icon: <HeartPulse className="w-6 h-6 text-teal-600 dark:text-teal-400" />,
      description: 'Hospitals issue immunization certificates and insurance eligibility with minimum-disclosure privacy controls.',
      examples: ['Immunization Record Certificate', 'Health Insurance Eligibility', 'Medical Attestation']
    }
  ];

  return (
    <section id="domains" className="py-16 md:py-24 border-b border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-12">
          <Badge variant="sage" className="px-3 py-1 text-xs">
            Cross-Domain Identity Architecture
          </Badge>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Connecting Records Across Life Stages
          </h2>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
            As citizens transition from education to employment, finance, and healthcare, CredLink enables authorized institutions to issue and verify domain-specific records without exposing raw private data.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {domains.map((domain) => (
            <Card key={domain.id} className="flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-all">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-800">
                    {domain.icon}
                  </div>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded border ${domain.badgeColor}`}>
                    {domain.badge}
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">{domain.title}</h3>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">{domain.subtitle}</p>
                </div>

                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  {domain.description}
                </p>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Verifiable Credentials:
                  </p>
                  {domain.examples.map((ex) => (
                    <div key={ex} className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-forest-800 dark:text-sage-500 shrink-0" />
                      <span>{ex}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

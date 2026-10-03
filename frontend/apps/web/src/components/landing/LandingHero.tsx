'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, ShieldCheck, GraduationCap, Briefcase, Landmark, HeartPulse, Lock, UserCheck } from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

export function LandingHero() {
  return (
    <section className="relative pt-8 pb-10 md:pt-20 md:pb-24 overflow-hidden border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-[#090D16]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: Copy & Actions */}
          <div className="lg:col-span-7 space-y-5 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-forest-100 text-forest-800 dark:bg-forest-900/60 dark:text-forest-200 border border-forest-200 dark:border-forest-700 text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 md:w-4 md:h-4 text-forest-800 dark:text-forest-200" />
              <span>Unified Life-Stage Credential Architecture</span>
            </div>

            <h1 className="text-[28px] leading-[1.15] sm:text-4xl lg:text-5xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              Your identity moves with you.{' '}
              <span className="text-forest-800 dark:text-sage-500 block mt-1 sm:inline sm:mt-0">
                Your records should too.
              </span>
            </h1>

            <p className="text-[15px] leading-relaxed sm:text-base text-slate-600 dark:text-slate-300 max-w-2xl mx-auto lg:mx-0">
              CredLink connects verified digital credentials across <strong>Education</strong>, <strong>Employment</strong>, <strong>Finance</strong>, and <strong>Healthcare</strong>. Citizens manage consent-driven disclosures while institutions issue and verify tamper-proof records.
            </p>

            {/* CTA Buttons — stacked full-width on mobile */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center lg:justify-start gap-3 pt-1">
              <a href="#how-it-works" className="block">
                <Button variant="forest" size="lg" className="w-full sm:w-auto gap-2 h-12 md:h-11 text-[15px] md:text-sm">
                  <span>Explore How It Works</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </a>
              <Link href="/login" className="block">
                <Button variant="outline" size="lg" className="w-full sm:w-auto gap-2 h-12 md:h-11 text-[15px] md:text-sm">
                  <span>Institutional Access Portal</span>
                </Button>
              </Link>
            </div>

            {/* Platform Highlights — horizontal scroll on very small screens */}
            <div className="pt-5 border-t border-slate-200/60 dark:border-slate-800/80 grid grid-cols-3 gap-3 md:gap-4 text-center lg:text-left">
              <div>
                <p className="text-base md:text-lg font-bold text-slate-900 dark:text-slate-100">4 Domains</p>
                <p className="text-[11px] md:text-sm text-slate-500 dark:text-slate-400 leading-tight">Edu, Work, Bank, Health</p>
              </div>
              <div>
                <p className="text-base md:text-lg font-bold text-slate-900 dark:text-slate-100">Zero-Knowledge</p>
                <p className="text-[11px] md:text-sm text-slate-500 dark:text-slate-400 leading-tight">Selective Disclosure</p>
              </div>
              <div>
                <p className="text-base md:text-lg font-bold text-slate-900 dark:text-slate-100">100% Consent</p>
                <p className="text-[11px] md:text-sm text-slate-500 dark:text-slate-400 leading-tight">Citizen Controlled</p>
              </div>
            </div>
          </div>

          {/* Right Column: Visual Network Diagram */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="relative w-full max-w-md p-4 md:p-6 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xs space-y-4 md:space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <span className="text-[13px] md:text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-forest-800 dark:text-sage-500" />
                  Citizen Digital Identity Wallet
                </span>
                <Badge variant="sage" size="sm" className="text-[10px] md:text-xs">Active Identity</Badge>
              </div>

              {/* 4 Core Connected Domains */}
              <div className="grid grid-cols-2 gap-2.5 md:gap-3">
                <div className="p-3 md:p-3.5 bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/40 rounded-xl space-y-1">
                  <div className="flex items-center justify-between">
                    <GraduationCap className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span className="text-[10px] md:text-xs font-mono font-bold text-blue-700 dark:text-blue-300">EDU</span>
                  </div>
                  <p className="text-[13px] md:text-sm font-semibold text-slate-900 dark:text-slate-100">Education</p>
                  <p className="text-[11px] md:text-xs text-slate-500 dark:text-slate-400 leading-tight">Degree & Transcript Attestations</p>
                </div>

                <div className="p-3 md:p-3.5 bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200/60 dark:border-indigo-900/40 rounded-xl space-y-1">
                  <div className="flex items-center justify-between">
                    <Briefcase className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span className="text-[10px] md:text-xs font-mono font-bold text-indigo-700 dark:text-indigo-300">EMP</span>
                  </div>
                  <p className="text-[13px] md:text-sm font-semibold text-slate-900 dark:text-slate-100">Employment</p>
                  <p className="text-[11px] md:text-xs text-slate-500 dark:text-slate-400 leading-tight">Work History & Credentials</p>
                </div>

                <div className="p-3 md:p-3.5 bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-900/40 rounded-xl space-y-1">
                  <div className="flex items-center justify-between">
                    <Landmark className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-[10px] md:text-xs font-mono font-bold text-emerald-700 dark:text-emerald-300">FIN</span>
                  </div>
                  <p className="text-[13px] md:text-sm font-semibold text-slate-900 dark:text-slate-100">Finance</p>
                  <p className="text-[11px] md:text-xs text-slate-500 dark:text-slate-400 leading-tight">KYC & Financial Eligibility</p>
                </div>

                <div className="p-3 md:p-3.5 bg-teal-50/60 dark:bg-teal-950/30 border border-teal-200/60 dark:border-teal-900/40 rounded-xl space-y-1">
                  <div className="flex items-center justify-between">
                    <HeartPulse className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                    <span className="text-[10px] md:text-xs font-mono font-bold text-teal-700 dark:text-teal-300">HEALTH</span>
                  </div>
                  <p className="text-[13px] md:text-sm font-semibold text-slate-900 dark:text-slate-100">Healthcare</p>
                  <p className="text-[11px] md:text-xs text-slate-500 dark:text-slate-400 leading-tight">Immunization & Insurance</p>
                </div>
              </div>

              {/* Bottom Security Note */}
              <div className="p-2.5 md:p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-slate-800 flex items-center gap-2 text-[11px] md:text-xs text-slate-600 dark:text-slate-400">
                <Lock className="w-3.5 h-3.5 text-forest-800 dark:text-sage-500 shrink-0" />
                <span>Issuer identity & trust status verified by Root Trust Registry.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { AlertTriangle, Check, Minus, ShieldCheck, X } from 'lucide-react';

import {
  demoCredential,
  verificationChecks,
  verificationScenarios,
  type VerificationScenarioKey,
} from '../../lib/landing-content';
import { cn } from '../../lib/utils';

type CheckState = 'passed' | 'failed' | 'skipped';

interface LedgerRow {
  key: string;
  label: string;
  state: CheckState;
  note: string;
}

const SCENARIO_COPY: Record<
  VerificationScenarioKey,
  { verdict: string; tone: 'verified' | 'rejected'; detail: string }
> = {
  active: {
    verdict: 'Verified',
    tone: 'verified',
    detail: 'All four checks passed. The claims are released in plaintext to the verifier.',
  },
  revoked: {
    verdict: 'Rejected',
    tone: 'rejected',
    detail: 'The signature is valid, but the issuer revoked the credential after issuance.',
  },
  suspended: {
    verdict: 'Rejected',
    tone: 'rejected',
    detail: 'Issuer trust is suspended, so the lifecycle check never runs.',
  },
};

function ledgerFor(scenario: VerificationScenarioKey): LedgerRow[] {
  const revoked = scenario === 'revoked';
  const suspended = scenario === 'suspended';
  return [
    {
      key: 'present',
      label: verificationChecks[0],
      state: 'passed',
      note: 'Record found in the credential archive',
    },
    {
      key: 'signature',
      label: verificationChecks[1],
      state: 'passed',
      note: revoked ? 'Signature was valid before revocation' : 'Ed25519 over a did:key issuer',
    },
    {
      key: 'trust',
      label: verificationChecks[2],
      state: suspended ? 'failed' : 'passed',
      note: suspended
        ? 'Trust registry status is SUSPENDED'
        : 'Registered and accredited for education',
    },
    {
      key: 'status',
      label: verificationChecks[3],
      state: suspended ? 'skipped' : revoked ? 'failed' : 'passed',
      note: suspended
        ? 'Sequence stops while issuer trust is unresolved'
        : revoked
          ? 'Revocation recorded by Westbridge University'
          : 'No revocation recorded and not past expiry',
    },
  ];
}

function StateChip({ state }: { state: CheckState }) {
  const map = {
    passed: {
      className: 'border-[#4f9d76]/40 bg-[#4f9d76]/15 text-[#9ad9b6]',
      icon: <Check aria-hidden className="size-3" strokeWidth={3} />,
      label: 'Passed',
    },
    failed: {
      className: 'border-[#e08a95]/40 bg-[#e08a95]/15 text-[#f2b0b8]',
      icon: <X aria-hidden className="size-3" strokeWidth={3} />,
      label: 'Failed',
    },
    skipped: {
      className: 'border-paper-0/20 bg-paper-0/[0.06] text-paper-0/60',
      icon: <Minus aria-hidden className="size-3" strokeWidth={3} />,
      label: 'Not checked',
    },
  } as const;
  const tone = map[state];
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-micro', tone.className)}>
      {tone.icon}
      {tone.label}
    </span>
  );
}

export function Verification() {
  const reduce = useReducedMotion();
  const [scenario, setScenario] = useState<VerificationScenarioKey>('active');
  const [resolved, setResolved] = useState(0);
  const timers = useRef<number[]>([]);

  const ledger = ledgerFor(scenario);
  const copy = SCENARIO_COPY[scenario];
  const complete = resolved >= ledger.length;

  useEffect(() => {
    timers.current.forEach((timer) => window.clearTimeout(timer));
    timers.current = [];
    if (reduce) {
      setResolved(ledger.length);
      return;
    }
    setResolved(0);
    ledger.forEach((_row, index) => {
      timers.current.push(window.setTimeout(() => setResolved(index + 1), 200 * (index + 1)));
    });
    return () => {
      timers.current.forEach((timer) => window.clearTimeout(timer));
      timers.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scenario, reduce]);

  return (
    <section id="trust" className="relative isolate overflow-hidden bg-forest-950 text-paper-0">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-forest-300/40 to-transparent"
      />
      <div className="container-editorial relative py-20 lg:py-28">
        <header className="max-w-xl">
          <p className="eyebrow text-paper-0/55">Evidence</p>
          <h2 className="type-display mt-3 text-h2 text-balance text-paper-0">Presence is not proof.</h2>
          <p className="mt-4 max-w-measure text-body-lg text-paper-0/70">
            Four separate checks stand between a record and trust.
          </p>
        </header>

        <div className="mt-12 grid gap-6 lg:mt-16 lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)] lg:gap-10">
          <div className="flex flex-col gap-6">
            <div
              role="group"
              aria-label="Verification scenario"
              className="inline-flex w-fit flex-wrap gap-1 rounded-control border border-paper-0/15 bg-paper-0/[0.04] p-1"
            >
              {verificationScenarios.map((item) => {
                const active = item.key === scenario;
                return (
                  <button
                    key={item.key}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setScenario(item.key)}
                    className={cn(
                      'relative rounded-[6px] px-3 py-1.5 text-sm transition-colors duration-150',
                      active ? 'font-semibold text-slate-950' : 'text-slate-200 hover:text-white font-medium',
                    )}
                  >
                    {active ? (
                      <motion.span
                        layoutId="verification-scenario"
                        className="absolute inset-0 -z-10 rounded-[6px] bg-white shadow-xs"
                        transition={{ duration: reduce ? 0 : 0.26, ease: [0.22, 1, 0.36, 1] }}
                      />
                    ) : null}
                    {item.label}
                  </button>
                );
              })}
            </div>

            <div className="rounded-panel border border-paper-0/12 bg-paper-0/[0.03] p-5">
              <p className="text-micro text-paper-0/60">Record under review</p>
              <p className="mt-2 text-body font-medium text-paper-0">{demoCredential.award}</p>
              <p className="text-ui text-paper-0/65">{demoCredential.field}</p>
              <dl className="mt-4 flex flex-col gap-3 border-t border-paper-0/12 pt-4">
                <div>
                  <dt className="text-micro text-paper-0/60">Issuer</dt>
                  <dd className="text-ui text-paper-0/85">{demoCredential.institution}</dd>
                </div>
                <div>
                  <dt className="text-micro text-paper-0/60">Subject</dt>
                  <dd className="text-ui text-paper-0/85">{demoCredential.holder}</dd>
                </div>
                <div>
                  <dt className="text-micro text-paper-0/60">Identifier</dt>
                  <dd className="mono-value break-all !text-paper-0/70">{demoCredential.identifier}</dd>
                </div>
              </dl>
            </div>
          </div>

          <div className="rounded-surface border border-paper-0/12 bg-paper-0/[0.03] p-5 sm:p-6">
            <ol className="flex flex-col">
              {ledger.map((row, index) => {
                const visible = index < resolved;
                return (
                  <li
                    key={row.key}
                    className={cn(
                      'flex flex-wrap items-start justify-between gap-x-6 gap-y-2 border-b border-paper-0/10 py-4 transition-opacity duration-200 last:border-b-0',
                      visible ? 'opacity-100' : 'opacity-45',
                    )}
                  >
                    <div className="flex min-w-0 items-start gap-3">
                      <span
                        aria-hidden
                        className={cn(
                          'mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border text-micro',
                          visible
                            ? row.state === 'passed'
                              ? 'border-[#4f9d76]/50 bg-[#4f9d76]/20 text-[#9ad9b6]'
                              : row.state === 'failed'
                                ? 'border-[#e08a95]/50 bg-[#e08a95]/20 text-[#f2b0b8]'
                                : 'border-paper-0/25 text-paper-0/60'
                            : 'border-paper-0/20 text-transparent',
                        )}
                      >
                        {visible ? index + 1 : index + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="text-body text-paper-0">{row.label}</p>
                        <p className="mt-0.5 text-micro text-paper-0/60">
                          {visible ? row.note : 'Waiting for the previous check'}
                        </p>
                      </div>
                    </div>
                    <div className="shrink-0">
                      {visible ? (
                        <StateChip state={row.state} />
                      ) : (
                        <span className="text-micro text-paper-0/55">Checking</span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>

            <div
              aria-live="polite"
              className={cn(
                'mt-5 flex items-start gap-3 rounded-panel border p-4 transition-colors duration-300',
                copy.tone === 'verified'
                  ? 'border-[#4f9d76]/35 bg-[#4f9d76]/12'
                  : 'border-[#e08a95]/35 bg-[#e08a95]/12',
              )}
            >
              <span aria-hidden className="mt-0.5 shrink-0">
                {copy.tone === 'verified' ? (
                  <ShieldCheck className="size-5 text-[#9ad9b6]" />
                ) : (
                  <AlertTriangle className="size-5 text-[#f2b0b8]" />
                )}
              </span>
              <div className="min-w-0">
                <p className="text-body font-semibold text-paper-0">
                  {complete ? copy.verdict : 'Checking\u2026'}
                </p>
                <p className="mt-0.5 text-ui text-paper-0/70">
                  {complete ? copy.detail : 'Resolving each check in order.'}
                </p>
              </div>
            </div>

            <p className="mt-4 text-micro text-paper-0/60">
              Synthetic example. A failed check is a normal outcome, not an error.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

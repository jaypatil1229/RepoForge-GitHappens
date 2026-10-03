'use client';

import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Lock, RotateCcw } from 'lucide-react';

import { Button } from '../ui/Button';
import { demoCredential, requester } from '../../lib/landing-content';
import { cn } from '../../lib/utils';

export function Consent() {
  const claims = demoCredential.claims;
  const defaultSelection = useMemo(
    () => claims.filter((claim) => !claim.optional).map((claim) => claim.key),
    [claims],
  );
  const [selected, setSelected] = useState<string[]>(defaultSelection);
  const [approved, setApproved] = useState(false);

  const chosen = useMemo(
    () => claims.filter((claim) => selected.includes(claim.key)),
    [claims, selected],
  );

  const isDefault =
    !approved &&
    selected.length === defaultSelection.length &&
    defaultSelection.every((key) => selected.includes(key));

  function toggle(key: string) {
    setApproved(false);
    setSelected((current) =>
      current.includes(key) ? current.filter((item) => item !== key) : [...current, key],
    );
  }

  return (
    <section id="consent" className="border-t border-line-200 bg-paper-0">
      <div className="container-editorial py-20 lg:py-28">
        <header className="max-w-xl">
          <p className="eyebrow">Consent</p>
          <h2 className="type-display mt-3 text-h2 text-balance text-ink-950">Your choice, claim by claim.</h2>
          <p className="mt-4 max-w-measure text-body-lg text-pretty text-ink-600">
            Approve only what this request needs.
          </p>
        </header>

        <div className="mt-12 grid gap-6 lg:mt-16 lg:grid-cols-2 lg:gap-8">
          <div className="rounded-surface border border-line-200 bg-paper-0 p-5 shadow-raised sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line-200 pb-4">
              <div className="min-w-0">
                <p className="text-micro text-ink-500">Request from</p>
                <p className="mt-0.5 text-body font-semibold text-ink-950">{requester.name}</p>
                <p className="text-ui text-ink-600">{requester.purpose}</p>
              </div>
              <span className="rounded-full border border-line-200 bg-paper-50 px-2.5 py-1 text-micro text-ink-600">
                {claims.length} claims requested
              </span>
            </div>

            <fieldset className="mt-4">
              <legend className="text-micro text-ink-500">Choose what to release</legend>
              <div className="mt-3 flex flex-col gap-2">
                {claims.map((claim) => {
                  const checked = selected.includes(claim.key);
                  return (
                    <label
                      key={claim.key}
                      className={cn(
                        'flex cursor-pointer items-start gap-3 rounded-control border p-3.5 transition-colors duration-150',
                        checked ? 'border-forest-800/35 bg-forest-50' : 'border-line-200 bg-paper-0 hover:border-line-300',
                      )}
                    >
                      <input
                        type="checkbox"
                        className="peer sr-only"
                        checked={checked}
                        onChange={() => toggle(claim.key)}
                      />
                      <span
                        aria-hidden
                        className={cn(
                          'mt-0.5 grid size-[18px] shrink-0 place-items-center rounded-[5px] border transition-colors duration-150 peer-focus-visible:ring-2 peer-focus-visible:ring-forest-700 peer-focus-visible:ring-offset-2',
                          checked ? 'border-forest-800 bg-forest-800' : 'border-line-300 bg-paper-0',
                        )}
                      >
                        {checked ? <Check className="size-3 text-paper-0" strokeWidth={3} /> : null}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-baseline justify-between gap-x-3">
                          <span className="text-ui font-medium text-ink-950">{claim.label}</span>
                          {claim.optional ? (
                            <span className="text-micro text-ink-500">Not required</span>
                          ) : null}
                        </span>
                        <span className="mt-0.5 block truncate text-ui text-ink-600">{claim.value}</span>
                      </span>
                    </label>
                  );
                })}
              </div>
            </fieldset>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-line-200 pt-4">
              <p aria-live="polite" className="text-ui text-ink-600">
                {chosen.length} of {claims.length} claims selected
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="md"
                  className="text-slate-900 font-medium border-line-300"
                  onClick={() => {
                    setSelected(defaultSelection);
                    setApproved(false);
                  }}
                  disabled={isDefault}
                  icon={<RotateCcw aria-hidden className="size-3.5" />}
                >
                  Reset
                </Button>
                <Button
                  size="md"
                  className="bg-forest-800 text-white font-semibold hover:bg-forest-700"
                  onClick={() => setApproved(true)}
                  disabled={chosen.length === 0}
                >
                  {approved ? 'Approved' : 'Approve these claims'}
                </Button>
              </div>
            </div>
          </div>

          <div className="relative flex flex-col rounded-surface border border-line-200 bg-celadon-100 p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3 border-b border-forest-800/12 pb-4">
              <div>
                <p className="text-micro text-forest-800/70">Recipient view</p>
                <p className="mt-0.5 text-body font-semibold text-forest-950">{requester.name}</p>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-forest-800/20 bg-paper-0/70 px-2.5 py-1 text-micro text-forest-800">
                <Lock aria-hidden className="size-3" />
                Consent required
              </span>
            </div>

            <div className="mt-4 flex-1">
              <AnimatePresence mode="wait" initial={false}>
                {approved && chosen.length > 0 ? (
                  <motion.div
                    key="receipt"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <p className="text-micro text-forest-800/70">Released claims</p>
                    <dl className="mt-3 divide-y divide-forest-800/12 rounded-panel border border-forest-800/15 bg-paper-0">
                      {chosen.map((claim) => (
                        <div key={claim.key} className="flex items-baseline justify-between gap-4 px-4 py-3">
                          <dt className="text-ui text-ink-600">{claim.label}</dt>
                          <dd className="text-ui font-medium text-ink-950">{claim.value}</dd>
                        </div>
                      ))}
                    </dl>
                    <p aria-live="polite" className="mt-4 text-micro text-forest-800/80">
                      Signature verified. Issuer trusted for education. No other claims were released.
                    </p>
                  </motion.div>
                ) : (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.24 }}
                    className="flex h-full min-h-[220px] flex-col items-center justify-center gap-2 rounded-panel border border-dashed border-forest-800/25 bg-paper-0/50 px-6 py-10 text-center"
                  >
                    <span aria-hidden className="grid size-9 place-items-center rounded-full border border-forest-800/20 bg-paper-0 text-forest-800">
                      <Lock className="size-4" />
                    </span>
                    <p className="text-body font-medium text-forest-950">Nothing shared yet</p>
                    <p className="max-w-xs text-ui text-forest-800/75">
                      {chosen.length === 0
                        ? 'Select at least one claim, then approve.'
                        : 'Approve the selection to release exactly these claims.'}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <p aria-live="polite" className="sr-only">
              {approved ? `${chosen.length} claims released to ${requester.name}.` : 'No claims released.'}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

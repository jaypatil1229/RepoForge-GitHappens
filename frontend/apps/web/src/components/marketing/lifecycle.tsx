'use client';

import React, { useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';

import { CredentialArtifact } from './credential-artifact';
import { demoCredential, lifecycleStages } from '../../lib/landing-content';
import { cn } from '../../lib/utils';

export function Lifecycle() {
  const reduce = useReducedMotion();
  const [index, setIndex] = useState(0);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const stage = lifecycleStages[index] ?? lifecycleStages[0];
  const last = lifecycleStages.length - 1;

  function select(next: number) {
    setIndex(next);
    tabRefs.current[next]?.focus();
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
      event.preventDefault();
      select(index === last ? 0 : index + 1);
    } else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
      event.preventDefault();
      select(index === 0 ? last : index - 1);
    } else if (event.key === 'Home') {
      event.preventDefault();
      select(0);
    } else if (event.key === 'End') {
      event.preventDefault();
      select(last);
    }
  }

  return (
    <section id="how-it-works" className="relative isolate overflow-hidden bg-forest-950 text-paper-0">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.06] [background-image:linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] [background-size:72px_72px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-40 top-1/3 size-[560px] rounded-full bg-forest-700/25 blur-3xl"
      />

      <div className="container-editorial relative py-20 lg:py-28">
        <header className="max-w-xl">
          <p className="eyebrow text-paper-0/55">The credential lifecycle</p>
          <h2 className="type-display mt-3 text-h2 text-balance text-paper-0">One record, four states.</h2>
          <p className="mt-4 max-w-measure text-body-lg text-paper-0/70">
            The same credential, from signature to proof.
          </p>
        </header>

        <div className="mt-12 grid gap-12 lg:mt-16 lg:grid-cols-[minmax(0,1.02fr)_minmax(0,0.98fr)] lg:items-center lg:gap-16">
          <div className="relative mx-auto w-full max-w-lg">
            <CredentialArtifact
              credential={demoCredential}
              stateLabel={stage.state}
              showProof={stage.key === 'verified'}
            />
            <div className="mt-4 flex items-center justify-between gap-4 text-micro text-paper-0/60">
              <span>Preview record</span>
              <span className="tabular">
                Stage {index + 1} of {lifecycleStages.length}
              </span>
            </div>
          </div>

          <div>
            <div
              role="tablist"
              aria-orientation="vertical"
              aria-label="Credential lifecycle stages"
              onKeyDown={onKeyDown}
              className="relative flex flex-col"
            >
              <span aria-hidden className="absolute left-[25px] top-9 h-[calc(100%_-_4.5rem)] w-px bg-paper-0/15" />
              <motion.span
                aria-hidden
                className="absolute left-[25px] top-9 w-px origin-top bg-forest-300"
                style={{ height: 'calc(100% - 4.5rem)' }}
                initial={false}
                animate={{ scaleY: last === 0 ? 0 : index / last }}
                transition={{ duration: reduce ? 0 : 0.45, ease: [0.22, 1, 0.36, 1] }}
              />

              {lifecycleStages.map((item, itemIndex) => {
                const active = itemIndex === index;
                const reached = itemIndex <= index;
                return (
                  <button
                    key={item.key}
                    ref={(node) => {
                      tabRefs.current[itemIndex] = node;
                    }}
                    id={`lifecycle-tab-${item.key}`}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    aria-controls={`lifecycle-panel-${item.key}`}
                    tabIndex={active ? 0 : -1}
                    onClick={() => setIndex(itemIndex)}
                    className={cn(
                      'relative z-10 flex w-full items-center gap-4 rounded-control px-2 py-3.5 text-left transition-colors duration-150',
                      active ? 'bg-paper-0/[0.06]' : 'hover:bg-paper-0/[0.035]',
                    )}
                  >
                    <span
                      aria-hidden
                      className={cn(
                        'tabular grid size-[34px] shrink-0 place-items-center rounded-full border text-micro transition-colors duration-200',
                        reached
                          ? 'border-forest-300 bg-forest-300 text-forest-950'
                          : 'border-paper-0/30 bg-forest-950 text-paper-0/60',
                      )}
                    >
                      {itemIndex + 1}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span
                        className={cn(
                          'block text-body font-medium transition-colors',
                          active ? 'text-paper-0' : 'text-paper-0/70',
                        )}
                      >
                        {item.label}
                      </span>
                      <span className={cn('block text-micro', active ? 'text-paper-0/70' : 'text-paper-0/55')}>
                        {item.state}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="relative mt-6 min-h-[96px] border-l border-paper-0/15 pl-5">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={stage.key}
                  id={`lifecycle-panel-${stage.key}`}
                  role="tabpanel"
                  aria-labelledby={`lifecycle-tab-${stage.key}`}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                >
                  <p className="text-body-lg text-paper-0/85">{stage.detail}</p>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

'use client';

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { CredentialArtifact } from '@/components/marketing/credential-artifact';
import { buttonStyles } from '@/components/ui/button';
import { demoCredential } from '@/lib/landing-content';
import { cn } from '@/lib/utils';

const VIEWS = [
  { key: 'award', label: 'The award' },
  { key: 'proof', label: 'The proof' },
] as const;

type HeroView = (typeof VIEWS)[number]['key'];

function TrustNode({
  role,
  name,
  detail,
  align = 'left',
  delay,
}: {
  role: string;
  name: string;
  detail: string;
  align?: 'left' | 'right';
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        'flex min-w-0 items-center gap-2.5',
        align === 'right' && 'sm:flex-row-reverse sm:text-right',
      )}
    >
      <span
        aria-hidden
        className={cn(
          'grid size-7 shrink-0 place-items-center rounded-full border',
          role === 'You'
            ? 'border-forest-800 bg-forest-800 text-paper-0'
            : 'border-line-300 bg-paper-0 text-forest-800',
        )}
      >
        <span className={cn('block rounded-full bg-current', role === 'You' ? 'size-2' : 'size-1.5')} />
      </span>
      <span className="min-w-0">
        <span className="block text-micro text-ink-500">{role}</span>
        <span className="block truncate text-ui font-medium text-ink-950">{name}</span>
        <span className="block truncate text-micro text-ink-500 sm:hidden xl:block">{detail}</span>
      </span>
    </motion.div>
  );
}

/**
 * The connector switches orientation with the trustline. On phones the three
 * anchors stack, so the line is vertical; from `sm` up the anchors sit in a row.
 */
function TrustConnector({ delay }: { delay: number }) {
  const transition = { duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] as const };
  return (
    <span
      aria-hidden
      className="relative ml-[13px] block h-4 w-px bg-line-200 sm:ml-0 sm:h-px sm:w-auto sm:min-w-6 sm:flex-1"
    >
      <motion.span
        className="absolute inset-0 block bg-forest-600/70 sm:hidden"
        initial={{ scaleY: 0 }}
        animate={{ scaleY: 1 }}
        style={{ transformOrigin: 'top center' }}
        transition={transition}
      />
      <motion.span
        className="absolute inset-0 hidden bg-forest-600/70 sm:block"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        style={{ transformOrigin: 'left center' }}
        transition={transition}
      />
    </span>
  );
}

export function Hero() {
  const [view, setView] = useState<HeroView>('award');
  const reduce = useReducedMotion();

  return (
    <section className="relative isolate overflow-hidden bg-paper-0">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[620px] bg-[radial-gradient(120%_90%_at_78%_18%,var(--celadon-200)_0%,transparent_58%)]"
      />
      <div className="container-editorial pb-14 pt-10 lg:flex lg:min-h-[calc(100svh_-_var(--nav-h))] lg:items-center lg:pb-20 lg:pt-12">
        <div className="grid w-full grid-cols-[minmax(0,1fr)] items-center gap-12 lg:grid-cols-[minmax(0,0.86fr)_minmax(0,1.14fr)] lg:gap-14 xl:gap-20">
          <div className="max-w-xl">
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="inline-flex items-center gap-2 text-micro text-ink-500"
            >
              <span aria-hidden className="size-1.5 rounded-full bg-forest-600" />
              Live preview &middot; synthetic records
            </motion.p>

            <motion.h1
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.06, ease: [0.22, 1, 0.36, 1] }}
              className="type-display mt-5 text-display-l text-balance text-ink-950"
            >
              Proof that moves with you.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.14, ease: [0.22, 1, 0.36, 1] }}
              className="mt-5 max-w-measure text-body-lg text-pretty text-ink-600"
            >
              One record. Issued by the institution, shared by you, verified anywhere.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="mt-8 flex flex-wrap items-center gap-3"
            >
              <Link href="/demo" className={buttonStyles({ size: 'lg', className: 'group' })}>
                Explore the preview
                <ArrowRight aria-hidden className="size-4 transition-transform duration-150 group-hover:translate-x-0.5" />
              </Link>
              <Link href="/how-it-works" className={buttonStyles({ variant: 'secondary', size: 'lg' })}>
                See how it works
              </Link>
            </motion.div>
          </div>

          <div className="relative">
            <div className="mb-3 flex items-center justify-between gap-4">
              <div
                role="group"
                aria-label="Credential view"
                className="relative inline-flex rounded-control border border-line-200 bg-paper-50 p-0.5"
              >
                {VIEWS.map((item) => {
                  const selected = view === item.key;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => setView(item.key)}
                      className={cn(
                        'relative z-10 inline-flex h-8 items-center rounded-[6px] px-3 text-ui transition-colors',
                        selected ? 'font-medium text-ink-950' : 'text-ink-600 hover:text-ink-950',
                      )}
                    >
                      {selected ? (
                        <motion.span
                          layoutId="hero-view-indicator"
                          className="absolute inset-0 -z-10 rounded-[6px] bg-paper-0 shadow-hairline"
                          transition={{ duration: reduce ? 0 : 0.28, ease: [0.22, 1, 0.36, 1] }}
                        />
                      ) : null}
                      {item.label}
                    </button>
                  );
                })}
              </div>
              <p className="hidden text-micro text-ink-500 sm:block">
                {view === 'award' ? 'What the holder sees' : 'What a verifier checks'}
              </p>
            </div>

            <div className="relative">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={view}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
                >
                  <CredentialArtifact credential={demoCredential} showProof={view === 'proof'} />
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="mt-6 flex flex-col items-start gap-0 sm:flex-row sm:items-center sm:gap-2 md:gap-3">
              <TrustNode role="Issuer" name="Westbridge University" detail="Accredited for education" delay={0.3} />
              <TrustConnector delay={0.45} />
              <TrustNode role="You" name="Aarav Mehta" detail="Holds the record" delay={0.5} />
              <TrustConnector delay={0.65} />
              <TrustNode
                role="Verifier"
                name="Apex Global Bank"
                detail="Checks the proof"
                align="right"
                delay={0.7}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
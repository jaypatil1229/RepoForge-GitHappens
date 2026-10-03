'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
} from 'framer-motion';

import { cn } from '../../lib/utils';

const fragments = [
  {
    key: 'education',
    domain: 'Education',
    value: 'Bachelor of Science',
    source: 'Westbridge University',
    rail: '3%',
    x: ['-45%', '0%'],
    y: ['-120%', '0%'],
    rotate: [-8, 0],
  },
  {
    key: 'employment',
    domain: 'Employment',
    value: 'Senior Analyst',
    source: 'Northline Group',
    rail: '26%',
    x: ['38%', '0%'],
    y: ['-88%', '0%'],
    rotate: [7, 0],
  },
  {
    key: 'finance',
    domain: 'Finance',
    value: 'KYC verified',
    source: 'Apex Global Bank',
    rail: '49%',
    x: ['-42%', '0%'],
    y: ['118%', '0%'],
    rotate: [5, 0],
  },
  {
    key: 'healthcare',
    domain: 'Healthcare',
    value: 'Immunisation record',
    source: 'Meridian Health',
    rail: '73%',
    x: ['48%', '0%'],
    y: ['85%', '0%'],
    rotate: [-6, 0],
  },
] as const;

/** Gate the pinned scene on the conditions the motion spec allows. */
function usePinnedScene() {
  const reduce = useReducedMotion();
  const [room, setRoom] = useState(false);

  useEffect(() => {
    const query = window.matchMedia('(min-width: 1024px) and (min-height: 700px) and (pointer: fine)');
    const update = () => setRoom(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);

  return room && !reduce;
}

/**
 * Scroll drives transforms only — they stay exact on every frame. Copy changes are
 * discrete, with hysteresis so a heading never sits half-swapped over its sibling.
 */
function useConnectedPhase(progress: MotionValue<number>) {
  const [connected, setConnected] = useState(false);
  useMotionValueEvent(progress, 'change', (value) => {
    setConnected((current) => {
      if (!current && value > 0.52) return true;
      if (current && value < 0.44) return false;
      return current;
    });
  });
  return connected;
}

function FragmentCard({ item, className }: { item: (typeof fragments)[number]; className?: string }) {
  return (
    <article
      className={cn(
        'w-full rounded-panel border border-line-200 bg-paper-0 p-3.5 shadow-raised sm:p-4 text-ink-950',
        className,
      )}
    >
      <p className="text-micro text-ink-500">{item.domain}</p>
      <p className="mt-1.5 text-ui font-medium leading-snug text-ink-950">{item.value}</p>
      <div aria-hidden className="my-3 h-px bg-line-200" />
      <p className="truncate text-micro text-ink-600">{item.source}</p>
    </article>
  );
}

function SceneHeading({ connected }: { connected: boolean }) {
  const reduce = useReducedMotion();
  const transition = { duration: reduce ? 0 : 0.4, ease: [0.22, 1, 0.36, 1] as const };
  return (
    <div className="relative h-[3.2rem] sm:h-[3.6rem]">
      <motion.h2
        initial={false}
        animate={{ opacity: connected ? 0 : 1, y: connected ? -8 : 0 }}
        transition={transition}
        className="type-display absolute inset-x-0 top-0 text-h2 text-ink-950"
      >
        Scattered across systems.
      </motion.h2>
      <motion.h2
        initial={false}
        animate={{ opacity: connected ? 1 : 0, y: connected ? 0 : 8 }}
        transition={transition}
        className="type-display absolute inset-x-0 top-0 text-h2 text-ink-950"
      >
        One path they can travel.
      </motion.h2>
    </div>
  );
}

function PinnedFragment({
  item,
  progress,
}: {
  item: (typeof fragments)[number];
  progress: MotionValue<number>;
}) {
  const x = useTransform(progress, [0.05, 0.78], [item.x[0], item.x[1]]);
  const y = useTransform(progress, [0.05, 0.78], [item.y[0], item.y[1]]);
  const rotate = useTransform(progress, [0.05, 0.78], [item.rotate[0], item.rotate[1]]);
  return (
    <motion.div
      style={{ left: item.rail, x, y, rotate }}
      className="absolute top-[47%] w-[22%] -translate-y-1/2"
    >
      <FragmentCard item={item} />
    </motion.div>
  );
}

function PinnedScene() {
  const wrapper = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: wrapper, offset: ['start start', 'end end'] });
  const connected = useConnectedPhase(scrollYProgress);

  const railScale = useTransform(scrollYProgress, [0.3, 0.86], [0, 1]);
  const reduce = useReducedMotion();
  const fade = { duration: reduce ? 0 : 0.4, ease: [0.22, 1, 0.36, 1] as const };

  return (
    <div ref={wrapper} className="relative h-[210vh]">
      <div className="sticky top-[var(--nav-h)] flex h-[calc(100svh_-_var(--nav-h))] items-center overflow-hidden">
        <div className="container-editorial w-full">
          <p className="eyebrow">The record landscape</p>
          <div className="mt-3">
            <SceneHeading connected={connected} />
          </div>

          <div className="relative mt-10 h-[460px]">
            <motion.div
              aria-hidden
              style={{ scaleX: railScale, transformOrigin: 'left center' }}
              className="absolute left-0 right-0 top-[47%] h-px bg-line-300"
            />
            <motion.div
              aria-hidden
              initial={false}
              animate={{ opacity: connected ? 1 : 0, scale: connected ? 1 : 0.6 }}
              transition={fade}
              className="absolute right-0 top-[47%] size-2.5 -translate-y-1/2 rounded-full border-2 border-forest-800 bg-paper-0"
            />
            {fragments.map((item) => (
              <PinnedFragment key={item.key} item={item} progress={scrollYProgress} />
            ))}
            <motion.p
              initial={false}
              animate={{ opacity: connected ? 1 : 0, y: connected ? 0 : 8 }}
              transition={fade}
              className="absolute inset-x-0 bottom-6 text-ui text-ink-600"
            >
              Each record keeps its own source. CredLink keeps the path between them.
            </motion.p>
          </div>
        </div>
      </div>
    </div>
  );
}

function StaticScene() {
  return (
    <div className="container-editorial py-16 sm:py-20">
      <p className="eyebrow">The record landscape</p>
      <h2 className="type-display mt-3 max-w-lg text-h2 text-balance text-ink-950">
        Scattered across systems.
      </h2>

      <ol className="relative mt-8 flex flex-col gap-3">
        <span aria-hidden className="absolute bottom-4 left-[11px] top-4 w-px bg-line-200" />
        {fragments.map((item) => (
          <li key={item.key} className="relative flex items-start gap-4">
            <span
              aria-hidden
              className="relative z-10 mt-4 size-[23px] shrink-0 rounded-full border border-line-300 bg-paper-50"
            />
            <div className="min-w-0 flex-1">
              <FragmentCard item={item} />
            </div>
          </li>
        ))}
      </ol>

      <h2 className="type-display mt-10 max-w-lg text-h2 text-balance text-ink-950">
        One path they can travel.
      </h2>
      <p className="mt-3 max-w-measure text-body-lg text-ink-600">
        Each record keeps its own source. CredLink keeps the path between them.
      </p>
    </div>
  );
}

export function Fragmentation() {
  const pinned = usePinnedScene();

  return (
    <section id="record-landscape" className="border-t border-line-200 bg-paper-50">
      {pinned ? <PinnedScene /> : <StaticScene />}
    </section>
  );
}

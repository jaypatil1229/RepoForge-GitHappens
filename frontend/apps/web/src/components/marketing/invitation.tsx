'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Building2 } from 'lucide-react';
import Link from 'next/link';

import { buttonStyles } from '../ui/Button';

const paths = [
  'M -20 -30 C 140 10 300 108 520 148',
  'M 1240 -30 C 1080 6 940 108 720 148',
  'M -20 200 C 160 200 300 176 520 148',
  'M 1240 200 C 1060 200 940 176 720 148',
];

export function Invitation() {
  return (
    <section id="invitation" className="relative isolate overflow-hidden bg-forest-900 text-paper-0">
      <svg
        aria-hidden
        focusable="false"
        viewBox="0 0 1200 170"
        preserveAspectRatio="none"
        className="pointer-events-none absolute inset-x-0 top-0 h-[170px] w-full text-forest-300/35"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
      >
        {paths.map((d, index) => (
          <motion.path
            key={d}
            d={d}
            initial={{ pathLength: 0, opacity: 0 }}
            whileInView={{ pathLength: 1, opacity: 1 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 1.1, delay: index * 0.12, ease: [0.22, 1, 0.36, 1] }}
            vectorEffect="non-scaling-stroke"
          />
        ))}
        <circle cx="620" cy="148" r="3.5" fill="currentColor" stroke="none" />
      </svg>

      <div className="container-editorial relative py-24 lg:py-32">
        <div className="mx-auto max-w-4xl pt-10 text-center sm:pt-16">
          <h2 className="type-display text-display-l text-balance text-paper-0">
            Your records, ready to travel.
          </h2>
          <p className="mx-auto mt-6 max-w-measure text-body-lg text-paper-0/70">
            Try all three roles with synthetic data.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/login"
              className={buttonStyles({ variant: 'inverse', size: 'lg', className: 'group' })}
            >
              Explore the preview
              <ArrowRight aria-hidden className="size-4 transition-transform duration-150 group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/register"
              className={buttonStyles({
                variant: 'secondary',
                size: 'lg',
                className: 'border-paper-0/25 bg-transparent text-paper-0 hover:border-paper-0/60 hover:bg-paper-0/10',
              })}
            >
              <Building2 aria-hidden className="size-4" />
              Register an institution
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

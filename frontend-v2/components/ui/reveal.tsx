'use client';

import { motion, type Variants } from 'framer-motion';
import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

const DISTANCE = 14;

/**
 * Entrance choreography: one small upward translate with a fade, staggered a little
 * across siblings.
 *
 * Nothing here branches on the reduced-motion preference. The root `MotionConfig`
 * is set to `reducedMotion="user"`, so Framer drops the translate for those visitors
 * while the fade still marks the arrival. Keeping the props deterministic is what
 * lets server and client render identical markup.
 */
export function Reveal({
  children,
  className,
  delay = 0,
  as = 'div',
  amount = 0.35,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  as?: 'div' | 'section' | 'li' | 'header' | 'article';
  amount?: number;
}) {
  const Component = motion[as];
  return (
    <Component
      className={className}
      initial={{ opacity: 0, y: DISTANCE }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount }}
      transition={{ duration: 0.6, delay, ease: [0.16, 0.84, 0.44, 1] }}
    >
      {children}
    </Component>
  );
}

export const staggerParent: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

export const staggerChild: Variants = {
  hidden: { opacity: 0, y: DISTANCE },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.16, 0.84, 0.44, 1] } },
};

export function StaggerGroup({
  children,
  className,
  as = 'div',
}: {
  children: ReactNode;
  className?: string;
  as?: 'div' | 'ul' | 'ol';
}) {
  const Component = motion[as];
  return (
    <Component
      className={className}
      variants={staggerParent}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.25 }}
    >
      {children}
    </Component>
  );
}

export function StaggerItem({
  children,
  className,
  as = 'div',
}: {
  children: ReactNode;
  className?: string;
  as?: 'div' | 'li';
}) {
  const Component = motion[as];
  return (
    <Component className={className} variants={staggerChild}>
      {children}
    </Component>
  );
}

export { cn };
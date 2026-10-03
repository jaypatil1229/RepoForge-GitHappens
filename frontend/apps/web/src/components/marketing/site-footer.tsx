import React from 'react';
import Link from 'next/link';

import { Logo } from '../ui/logo';

const columns = [
  {
    title: 'Product',
    links: [
      { href: '#how-it-works', label: 'How it works' },
      { href: '#trust', label: 'Trust and verification' },
      { href: '/login', label: 'Preview contexts' },
    ],
  },
  {
    title: 'Account',
    links: [
      { href: '/login', label: 'Sign in' },
      { href: '/register', label: 'Register' },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-line-200 bg-paper-50 text-ink-950">
      <div className="container-editorial grid gap-10 py-14 md:grid-cols-[minmax(0,1.4fr)_repeat(2,minmax(0,1fr))]">
        <div>
          <Logo />
          <p className="mt-4 max-w-xs text-ui text-ink-600">
            A consent-driven credential network for education, employment, finance and healthcare.
          </p>
          <p className="mt-5 max-w-sm text-micro text-ink-500">
            CredLink connects institutions, individuals, and verifiers with cryptographic proof and user consent.
          </p>
        </div>
        {columns.map((column) => (
          <nav key={column.title} aria-label={column.title}>
            <h2 className="text-ui font-semibold text-ink-950">{column.title}</h2>
            <ul className="mt-4 flex flex-col gap-2.5">
              {column.links.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-ui text-ink-600 transition-colors hover:text-ink-950">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t border-line-200">
        <div className="container-editorial flex flex-wrap items-center justify-between gap-3 py-5 text-micro text-ink-500">
          <p>CredLink — unified life-stage digital identity and verifiable record network.</p>
          <p>© {new Date().getFullYear()} CredLink. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

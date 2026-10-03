'use client';

import React, { useEffect, useState } from 'react';
import { Menu, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { Logo } from '../ui/logo';
import { cn } from '../../lib/utils';

const navigation = [
  { href: '#how-it-works', label: 'How it works' },
  { href: '#trust', label: 'Trust' },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [lifted, setLifted] = useState(false);

  useEffect(() => {
    const onScroll = () => setLifted(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <header
      className={cn(
        'sticky top-0 z-50 border-b transition-colors duration-200',
        lifted ? 'border-line-200 bg-paper-0/92 backdrop-blur-md' : 'border-transparent bg-paper-0',
      )}
    >
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50 focus:rounded-control focus:bg-forest-900 focus:px-3 focus:py-2 focus:text-ui focus:text-paper-0"
      >
        Skip to content
      </a>
      <div className="container-editorial flex h-[var(--nav-h)] items-center justify-between gap-6">
        <Link href="/" aria-label="CredLink home" className="rounded-control">
          <Logo />
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-control px-3 py-2 text-ui transition-colors text-ink-600 hover:text-ink-950 font-medium"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Link
            href="/login"
            className="inline-flex h-10 items-center rounded-control bg-forest-800 px-4 text-sm font-semibold text-white transition-colors hover:bg-forest-700 shadow-xs"
          >
            Explore the preview
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? 'Close menu' : 'Open menu'}
          className="inline-flex size-11 items-center justify-center rounded-control border border-line-300 bg-white text-slate-800 hover:bg-slate-50 md:hidden"
        >
          {open ? <X aria-hidden className="size-4" /> : <Menu aria-hidden className="size-4" />}
        </button>
      </div>

      {open ? (
        <div id="mobile-nav" className="border-t border-line-200 bg-paper-0 md:hidden">
          <nav aria-label="Primary mobile" className="container-editorial flex flex-col py-2">
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="rounded-control px-2 py-3 text-body font-medium text-ink-800"
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="my-2 inline-flex h-11 items-center justify-center rounded-control bg-forest-800 px-4 text-sm font-semibold text-white shadow-xs"
            >
              Explore the preview
            </Link>
          </nav>
        </div>
      ) : null}
    </header>
  );
}

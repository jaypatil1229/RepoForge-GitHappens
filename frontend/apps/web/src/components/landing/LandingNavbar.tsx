'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X, ArrowRight, Shield, ChevronRight } from 'lucide-react';
import { Button } from '../ui/Button';
import { CredLinkLogo } from '../ui/CredLinkLogo';
import { PWAInstallInlineButton } from '../pwa/PWAInstallButton';

export function LandingNavbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileMenuOpen]);

  const navLinks = [
    { href: '#how-it-works', label: 'How It Works' },
    { href: '#for-citizens', label: 'For Citizens' },
    { href: '#for-institutions', label: 'For Institutions' },
    { href: '#domains', label: 'Core Domains' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 md:h-16 flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="flex items-center group">
          <CredLinkLogo size="sm" showText />
        </Link>

        {/* Desktop Nav Links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600 dark:text-slate-300">
          {navLinks.map((link) => (
            <a key={link.href} href={link.href} className="hover:text-slate-900 dark:hover:text-slate-100 transition-colors">
              {link.label}
            </a>
          ))}
        </nav>

        {/* Desktop Action Buttons */}
        <div className="hidden md:flex items-center gap-3">
          <Link href="/login">
            <Button variant="outline" size="sm" className="text-xs">
              Institutional Login
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button variant="forest" size="sm" className="text-xs gap-1.5">
              <span>Launch Demo Portal</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>

        {/* Mobile Hamburger */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2.5 -mr-1 rounded-xl text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 active:bg-slate-100 dark:active:bg-slate-800 transition-colors"
          aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Full-Screen Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 top-14 z-40 bg-white dark:bg-slate-900 animate-slide-up">
          <div className="flex flex-col h-full">
            {/* Nav Links */}
            <nav className="flex-1 px-5 pt-4 space-y-1">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between py-4 px-3 text-base font-semibold text-slate-800 dark:text-slate-200 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 active:bg-slate-100 dark:active:bg-slate-800 transition-colors"
                >
                  <span>{link.label}</span>
                  <ChevronRight className="w-5 h-5 text-slate-400" />
                </a>
              ))}
            </nav>

            {/* Bottom Actions */}
            <div className="px-5 pb-8 space-y-3 border-t border-slate-100 dark:border-slate-800 pt-4">
              {/* PWA Install Button — mobile only */}
              <PWAInstallInlineButton />

              <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="block">
                <Button variant="outline" size="lg" className="w-full text-sm h-12">
                  Institutional Login
                </Button>
              </Link>

              <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)} className="block">
                <Button variant="forest" size="lg" className="w-full text-sm h-12 gap-2">
                  <span>Launch Demo Portal</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

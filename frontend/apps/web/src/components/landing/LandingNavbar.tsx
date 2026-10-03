'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X, ArrowRight, ChevronRight, Shield, Zap, FileCheck, ShieldCheck } from 'lucide-react';
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
    { href: '#how-it-works', label: 'How It Works', icon: Zap, desc: 'Three-step architecture' },
    { href: '#for-citizens', label: 'For Citizens', icon: ShieldCheck, desc: 'Consent-driven identity' },
    { href: '#for-institutions', label: 'For Institutions', icon: FileCheck, desc: 'Issue & verify credentials' },
    { href: '#domains', label: 'Core Domains', icon: Shield, desc: 'Edu, Work, Finance, Health' },
  ];

  return (
    <>
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
            <Link href="/login">
              <Button variant="forest" size="sm" className="text-xs gap-1.5">
                <span>Login</span>
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
      </header>

      {/* Mobile Full-Screen Overlay Menu — rendered OUTSIDE header to avoid z-index / clipping issues */}
      {mobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 z-[100]"
          style={{ backgroundColor: 'var(--bg-main, #f8fafc)' }}
        >
          {/* Top bar with brand + close */}
          <div
            className="h-14 px-4 flex items-center justify-between border-b"
            style={{
              backgroundColor: 'var(--bg-card, #ffffff)',
              borderColor: 'var(--border-main, #e2e8f0)',
            }}
          >
            <Link href="/" onClick={() => setMobileMenuOpen(false)} className="flex items-center">
              <CredLinkLogo size="sm" showText />
            </Link>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="p-2.5 -mr-1 rounded-xl text-slate-600 dark:text-slate-400 active:bg-slate-100 dark:active:bg-slate-800 transition-colors"
              aria-label="Close menu"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Menu Content */}
          <div className="flex flex-col h-[calc(100%-3.5rem)] overflow-y-auto bg-white dark:bg-[#090D16]">
            {/* Navigation Links */}
            <nav className="flex-1 px-4 pt-5 pb-4 space-y-1.5">
              <p className="px-3 pb-2 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                Navigate
              </p>
              {navLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3.5 py-3.5 px-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 active:bg-slate-100 dark:active:bg-slate-700 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5 text-forest-800 dark:text-sage-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[15px] font-semibold text-slate-900 dark:text-slate-100">{link.label}</p>
                      <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">{link.desc}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-300 dark:text-slate-600 shrink-0" />
                  </a>
                );
              })}
            </nav>

            {/* Bottom Actions */}
            <div className="px-4 pb-8 pt-4 space-y-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
              <p className="px-1 pb-1 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                Actions
              </p>

              {/* PWA Install Button — mobile only */}
              <PWAInstallInlineButton />

              <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="block">
                <Button variant="outline" size="lg" className="w-full text-[15px] font-semibold h-13 rounded-xl">
                  Institutional Login
                </Button>
              </Link>

              <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="block">
                <Button variant="forest" size="lg" className="w-full text-[15px] font-semibold h-13 gap-2 rounded-xl">
                  <span>Login</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

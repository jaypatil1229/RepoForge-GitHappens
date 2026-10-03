'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { Toast, ToastProps } from '../ui/Toast';
import { useRoleContext } from '../../hooks/useRoleContext';
import { CredLinkLogo } from '../ui/CredLinkLogo';
import {
  LayoutDashboard,
  FileCheck2,
  ShieldCheck,
  Building2,
  History,
  Lock,
} from 'lucide-react';
import { cn } from '../../lib/utils';

export interface ShellProps {
  children: React.ReactNode;
}

/**
 * Mobile bottom navigation — ALL navigable pages so hamburger menu is unnecessary.
 */
const mobileNavItems = [
  { href: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { href: '/credentials', label: 'Creds', icon: FileCheck2 },
  { href: '/verification', label: 'Verify', icon: ShieldCheck },
  { href: '/trust-registry', label: 'Trust', icon: Lock },
  { href: '/organizations', label: 'Issuers', icon: Building2 },
  { href: '/audit', label: 'Audit', icon: History },
];

export function Shell({ children }: ShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isLoading, currentUser, enterDemoMode } = useRoleContext();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [toasts, setToasts] = useState<Omit<ToastProps, 'onClose'>[]>([]);

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !currentUser)) {
      // Check if the user explicitly logged out
      const hasLoggedOut = typeof window !== 'undefined' && localStorage.getItem('credlink_logged_out') === 'true';
      if (hasLoggedOut) {
        // Clear the flag and redirect to landing page
        localStorage.removeItem('credlink_logged_out');
        router.push('/');
      } else {
        // First visit or page refresh — enter demo mode
        enterDemoMode();
      }
    }
  }, [isLoading, isAuthenticated, currentUser, enterDemoMode, router]);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  if (isLoading || !isAuthenticated || !currentUser) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#090D16] flex items-center justify-center p-4 antialiased">
        <div className="flex flex-col items-center gap-3">
          <CredLinkLogo size="md" className="animate-pulse" />
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Loading CredLink Portal...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#090D16] text-slate-900 dark:text-slate-100 font-sans flex flex-col md:flex-row antialiased">

      {/* Desktop Sidebar — completely hidden on mobile */}
      <div className="hidden md:block">
        <Sidebar isOpen={true} onCloseMobile={() => {}} />
      </div>

      {/* Main Content Workspace */}
      <div className="flex-1 flex flex-col md:pl-64 min-w-0 min-h-screen">
        <Topbar onToggleMobileSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)} />

        {/* Main Content — bottom padding for mobile nav bar */}
        <main className="flex-1 p-3 sm:p-4 md:p-6 lg:p-8 pb-24 md:pb-6 lg:pb-8 max-w-7xl w-full mx-auto animate-fade-in">
          {children}
        </main>
      </div>

      {/* ===== MOBILE BOTTOM NAVIGATION BAR ===== */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 pb-[env(safe-area-inset-bottom,0px)]">
        <div className="flex items-center justify-around h-[60px] px-0.5">
          {mobileNavItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex flex-col items-center justify-center gap-[2px] px-1 py-1 rounded-xl min-w-[48px] transition-all duration-150',
                  isActive
                    ? 'text-forest-800 dark:text-sage-400'
                    : 'text-slate-400 dark:text-slate-500 active:text-slate-600 dark:active:text-slate-300'
                )}
              >
                <div className={cn(
                  'flex items-center justify-center w-7 h-7 rounded-lg transition-all duration-150',
                  isActive && 'bg-forest-100 dark:bg-forest-900/50 scale-110'
                )}>
                  <Icon className={cn(
                    'w-[18px] h-[18px]',
                    isActive ? 'text-forest-800 dark:text-sage-400' : ''
                  )} />
                </div>
                <span className={cn(
                  'text-[9px] leading-none font-medium',
                  isActive && 'font-bold text-forest-800 dark:text-sage-400'
                )}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Toast Notification Container */}
      <div className="fixed bottom-20 md:bottom-4 right-4 left-4 md:left-auto z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <Toast {...toast} onClose={removeToast} />
          </div>
        ))}
      </div>
    </div>
  );
}

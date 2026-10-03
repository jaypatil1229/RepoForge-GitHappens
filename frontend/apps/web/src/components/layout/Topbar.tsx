'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, Search, Bell, ChevronDown, User, LogOut, ShieldAlert, HeartPulse, GraduationCap, Landmark, Briefcase, Shield, X, ScanLine } from 'lucide-react';
import { useRoleContext, deriveUserRole } from '../../hooks/useRoleContext';
import { UserRole } from '../../types';
import { Button } from '../ui/Button';
import { QrScanner } from '../qr/QrScanner';

interface TopbarProps {
  onToggleMobileSidebar: () => void;
}

export function Topbar({ onToggleMobileSidebar }: TopbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, switchRole, logout, memberships } = useRoleContext();
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showScanner, setShowScanner] = useState(false);

  const handleSignOut = async () => {
    await logout();
    router.push('/login');
  };

  const getPageTitle = (path: string) => {
    if (path.startsWith('/dashboard')) return 'Dashboard';
    if (path.startsWith('/credentials')) return 'Credentials';
    if (path.startsWith('/verification')) return 'Verification';
    if (path.startsWith('/trust-registry')) return 'Trust Registry';
    if (path.startsWith('/organizations')) return 'Issuers';
    if (path.startsWith('/audit')) return 'Audit Log';
    return 'Portal';
  };

  const getPageTitleFull = (path: string) => {
    if (path.startsWith('/dashboard')) return 'Dashboard Overview';
    if (path.startsWith('/credentials')) return 'Credential Management';
    if (path.startsWith('/verification')) return 'Verification Center';
    if (path.startsWith('/trust-registry')) return 'Trust Registry';
    if (path.startsWith('/organizations')) return 'Issuer Directory';
    if (path.startsWith('/audit')) return 'Audit & Activity Log';
    return 'Admin Portal';
  };

  const roles: { role: UserRole; label: string; icon: React.ReactNode }[] = [
    { role: 'HOSPITAL', label: 'Hospital / Healthcare', icon: <HeartPulse className="w-4 h-4 text-teal-600" /> },
    { role: 'COLLEGE', label: 'College / University', icon: <GraduationCap className="w-4 h-4 text-blue-600" /> },
    { role: 'BANK', label: 'Bank / Financial Inst.', icon: <Landmark className="w-4 h-4 text-emerald-600" /> },
    { role: 'EMPLOYER', label: 'Employer / Enterprise', icon: <Briefcase className="w-4 h-4 text-indigo-600" /> },
    { role: 'ADMIN', label: 'Network Administrator', icon: <Shield className="w-4 h-4 text-slate-600" /> },
  ];

  const userRole = currentUser?.role || 'CITIZEN';

  const availableRoles = roles.filter((r) => {
    if (!currentUser) return false;
    if (r.role === userRole) return true;
    return memberships.some((m) => deriveUserRole(undefined, m.organization?.domain) === r.role);
  });

  return (
    <header className="h-14 md:h-16 border-b border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-30 px-3 md:px-6 flex items-center justify-between">
      {/* Left: Mobile Menu & Page Title */}
      <div className="flex items-center gap-2 md:gap-3 min-w-0">
        {/* Hamburger — opens sidebar on mobile for extra nav (trust registry, etc.) */}
        <button
          onClick={onToggleMobileSidebar}
          className="p-2 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 md:hidden rounded-xl active:bg-slate-100 dark:active:bg-slate-800 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="min-w-0">
          {/* Short title on mobile, full title on desktop */}
          <h2 className="text-[15px] md:text-base font-bold text-slate-900 dark:text-slate-100 tracking-tight truncate">
            <span className="md:hidden">{getPageTitle(pathname)}</span>
            <span className="hidden md:inline">{getPageTitleFull(pathname)}</span>
          </h2>
          <p className="hidden md:block text-xs text-slate-400 dark:text-slate-500 font-medium">
            CredLink Portal
          </p>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-1.5 md:gap-2.5 shrink-0">
        {/* Scan QR Button — Citizens Only */}
        {userRole === 'CITIZEN' && (
          <button
            onClick={() => setShowScanner(true)}
            className="flex items-center gap-1.5 px-2 md:px-3 py-1.5 bg-teal-50 hover:bg-teal-100/80 dark:bg-teal-950/50 dark:hover:bg-teal-900/50 rounded-lg md:rounded-md border border-teal-200/80 dark:border-teal-800/80 text-xs md:text-sm font-medium text-teal-700 dark:text-teal-300 transition-colors active:bg-teal-100 dark:active:bg-teal-900"
            title="Scan QR Code (Verification / Consent)"
          >
            <ScanLine className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
            <span className="hidden sm:inline">Scan QR</span>
          </button>
        )}

        {/* Role Switcher — compact on mobile */}
        <div className="relative">
          <button
            onClick={() => setShowRoleMenu(!showRoleMenu)}
            className="flex items-center gap-1.5 px-2 md:px-3 py-1.5 bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700/80 rounded-lg md:rounded-md border border-slate-200/80 dark:border-slate-700 text-xs md:text-sm font-medium text-slate-800 dark:text-slate-200 transition-colors active:bg-slate-200 dark:active:bg-slate-700"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
            <span className="hidden sm:inline text-xs">Role:</span>
            <span className="font-bold text-slate-900 dark:text-slate-100 text-xs">{userRole}</span>
            {availableRoles.length > 1 && <ChevronDown className="w-3 h-3 text-slate-400" />}
          </button>

          {showRoleMenu && availableRoles.length > 0 && (
            <>
              {/* Backdrop to close on tap */}
              <div className="fixed inset-0 z-40" onClick={() => setShowRoleMenu(false)} />
              <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl py-1.5 z-50 animate-fade-in">
                <div className="px-3 py-1.5 text-xs font-semibold uppercase text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800">
                  Authorized Domains
                </div>
                {availableRoles.map((r) => (
                  <button
                    key={r.role}
                    onClick={() => {
                      switchRole(r.role);
                      setShowRoleMenu(false);
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-3 md:py-2 text-sm text-left active:bg-slate-100 dark:active:bg-slate-800 ${
                      userRole === r.role ? 'font-semibold bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100' : 'text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {r.icon}
                    <span>{r.label}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Notifications Icon */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 md:p-2 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 rounded-lg md:rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 relative transition-colors active:bg-slate-200 dark:active:bg-slate-700"
          >
            <Bell className="w-[18px] h-[18px] md:w-4 md:h-4" />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-indigo-600 rounded-full" />
          </button>

          {showNotifications && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
              <div className="absolute right-0 mt-2 w-[calc(100vw-2rem)] max-w-xs md:w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl p-3 z-50 animate-fade-in">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">Notifications</span>
                  <span className="text-xs bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-400 px-1.5 py-0.5 rounded font-medium">
                    2 New
                  </span>
                </div>
                <div className="mt-2 space-y-2 text-xs">
                  <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-100 dark:border-slate-800">
                    <p className="font-medium text-slate-800 dark:text-slate-200">Verification Request Received</p>
                    <p className="text-xs text-slate-500 mt-0.5">Apex Imperial Bank requested KYC claims.</p>
                    <span className="text-xs text-slate-400 mt-1 block">5m ago</span>
                  </div>
                  <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-100 dark:border-slate-800">
                    <p className="font-medium text-slate-800 dark:text-slate-200">Issuer Status Active</p>
                    <p className="text-xs text-slate-500 mt-0.5">St. Jude Hospital registered in Trust Registry.</p>
                    <span className="text-xs text-slate-400 mt-1 block">1h ago</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* User Profile / Logout — icon only on mobile */}
        <Link href="/login" onClick={handleSignOut}>
          <Button variant="outline" size="sm" className="text-xs gap-1.5 h-8 md:h-9 px-2 md:px-3">
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sign Out</span>
          </Button>
        </Link>
      </div>

      {/* Global QR Scanner Modal */}
      <QrScanner
        isOpen={showScanner}
        onClose={() => setShowScanner(false)}
        onConsentComplete={() => {
          // If on verification or dashboard page, reload state or trigger event
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('credlink-consent-updated'));
          }
        }}
      />
    </header>
  );
}

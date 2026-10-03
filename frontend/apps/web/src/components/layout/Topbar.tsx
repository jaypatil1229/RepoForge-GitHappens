'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Search, Bell, ChevronDown, User, LogOut, ShieldAlert, HeartPulse, GraduationCap, Landmark, Briefcase, Shield, X, Settings, Activity } from 'lucide-react';
import { useRoleContext, deriveUserRole } from '../../hooks/useRoleContext';
import { UserRole } from '../../types';
import { Button } from '../ui/Button';
import { CredLinkLogo } from '../ui/CredLinkLogo';
import { cn, getDomainBadgeStyle } from '../../lib/utils';
import { Badge } from '../ui/Badge';

interface TopbarProps {
  onToggleMobileSidebar: () => void;
}

export function Topbar({ onToggleMobileSidebar }: TopbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, switchRole, logout, memberships } = useRoleContext();
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  const handleSignOut = async () => {
    setShowProfileMenu(false);
    await logout();
    router.push('/login');
  };

  const getPageTitleFull = (path: string) => {
    if (path.startsWith('/dashboard')) return 'Dashboard Overview';
    if (path.startsWith('/credentials')) return 'Credential Management';
    if (path.startsWith('/verification')) return 'Verification Center';
    if (path.startsWith('/organizations')) return 'Issuers';
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
  const orgName = currentUser?.organizationName || 'Unaffiliated Citizen';
  const domainBadge = getDomainBadgeStyle(userRole);

  const availableRoles = roles.filter((r) => {
    if (!currentUser) return false;
    if (r.role === userRole) return true;
    return memberships.some((m) => deriveUserRole(undefined, m.organization?.domain) === r.role);
  });

  const getDomainIcon = (role: string) => {
    switch (role) {
      case 'HOSPITAL':
        return <HeartPulse className="w-4 h-4 text-teal-500" />;
      case 'COLLEGE':
        return <GraduationCap className="w-4 h-4 text-blue-500" />;
      case 'BANK':
        return <Landmark className="w-4 h-4 text-emerald-500" />;
      case 'EMPLOYER':
        return <Briefcase className="w-4 h-4 text-indigo-500" />;
      default:
        return <Shield className="w-4 h-4 text-forest-800 dark:text-sage-500" />;
    }
  };

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!currentUser?.name) return 'U';
    const parts = currentUser.name.split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return parts[0][0].toUpperCase();
  };

  return (
    <header className="h-14 md:h-16 border-b border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-30 px-3 md:px-6 flex items-center justify-between">

      {/* ===== LEFT SIDE ===== */}
      <div className="flex items-center gap-2 md:gap-3 min-w-0">
        {/* Mobile: CredLink Logo (no hamburger) */}
        <Link href="/dashboard" className="md:hidden flex items-center">
          <CredLinkLogo size="sm" showText />
        </Link>

        {/* Desktop: Page title */}
        <div className="hidden md:block min-w-0">
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 tracking-tight truncate">
            {getPageTitleFull(pathname)}
          </h2>
          <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
            CredLink Portal
          </p>
        </div>
      </div>

      {/* ===== RIGHT CONTROLS ===== */}
      <div className="flex items-center gap-1.5 md:gap-2.5 shrink-0">

        {/* Role Switcher — desktop only */}
        <div className="relative hidden md:block">
          <button
            onClick={() => setShowRoleMenu(!showRoleMenu)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700/80 rounded-md border border-slate-200/80 dark:border-slate-700 text-sm font-medium text-slate-800 dark:text-slate-200 transition-colors"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
            <span className="text-xs">Role:</span>
            <span className="font-bold text-slate-900 dark:text-slate-100 text-xs">{userRole}</span>
            {availableRoles.length > 1 && <ChevronDown className="w-3 h-3 text-slate-400" />}
          </button>

          {showRoleMenu && availableRoles.length > 0 && (
            <>
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
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left active:bg-slate-100 dark:active:bg-slate-800 ${
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
            className="p-2 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 relative transition-colors active:bg-slate-200 dark:active:bg-slate-700"
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

        {/* Desktop: Sign Out Button */}
        <button onClick={handleSignOut} className="hidden md:block">
          <Button variant="outline" size="sm" className="text-xs gap-1.5 h-9 px-3">
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </Button>
        </button>

        {/* ===== MOBILE: Profile Avatar ===== */}
        <div className="relative md:hidden" ref={profileMenuRef}>
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className={cn(
              'w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-150 border-2',
              showProfileMenu
                ? 'bg-forest-800 text-white border-forest-600 scale-105'
                : 'bg-gradient-to-br from-forest-700 to-forest-900 text-white border-forest-600/50 active:scale-95'
            )}
          >
            {getUserInitials()}
          </button>

          {/* Profile Dropdown — mobile */}
          {showProfileMenu && (
            <>
              <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px]" onClick={() => setShowProfileMenu(false)} />
              <div
                className="fixed right-3 top-[3.75rem] z-50 w-[calc(100vw-1.5rem)] max-w-[320px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-fade-in"
              >
                {/* User Info Header */}
                <div className="px-4 pt-4 pb-3 bg-gradient-to-br from-forest-50 to-slate-50 dark:from-forest-950/30 dark:to-slate-900 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-forest-700 to-forest-900 flex items-center justify-center text-white text-lg font-bold shrink-0 shadow-md">
                      {getUserInitials()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[15px] font-bold text-slate-900 dark:text-slate-100 truncate">
                        {currentUser?.name || 'Demo User'}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {currentUser?.email || 'demo@credlink.network'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Active Context */}
                <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                      Active Context
                    </span>
                    {getDomainIcon(userRole)}
                  </div>
                  <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 rounded-xl">
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                      {orgName}
                    </p>
                    <div className="mt-1.5 flex items-center justify-between">
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                        {userRole}
                      </span>
                      <Badge variant="neutral" size="sm" className={cn('text-[10px] py-0 px-1.5', domainBadge.bg, domainBadge.text, domainBadge.border)}>
                        {userRole === 'HOSPITAL' ? 'Healthcare' : domainBadge.label.split('/')[0]}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Role Switcher — mobile */}
                {availableRoles.length > 1 && (
                  <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 block">
                      Switch Domain
                    </span>
                    <div className="space-y-1">
                      {availableRoles.map((r) => (
                        <button
                          key={r.role}
                          onClick={() => {
                            switchRole(r.role);
                            setShowProfileMenu(false);
                          }}
                          className={cn(
                            'w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-colors',
                            userRole === r.role
                              ? 'font-semibold bg-forest-50 dark:bg-forest-950/30 text-forest-900 dark:text-sage-400 border border-forest-200 dark:border-forest-800'
                              : 'text-slate-700 dark:text-slate-300 active:bg-slate-100 dark:active:bg-slate-800'
                          )}
                        >
                          {r.icon}
                          <span className="text-[13px]">{r.label}</span>
                          {userRole === r.role && (
                            <span className="ml-auto w-2 h-2 rounded-full bg-emerald-500" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Network Status */}
                <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                    <Activity className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
                    <span className="text-[11px] font-medium">Network: <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Operational</span></span>
                  </div>
                </div>

                {/* Sign Out */}
                <div className="p-3">
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 font-semibold text-sm active:bg-red-100 dark:active:bg-red-900/40 transition-colors border border-red-200/60 dark:border-red-800/40"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

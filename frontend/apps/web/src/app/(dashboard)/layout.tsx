'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useRoleContext } from '../../hooks/useRoleContext';
import { CredLinkLogo } from '../../components/ui/CredLinkLogo';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated, isLoading, currentUser } = useRoleContext();

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !currentUser)) {
      router.replace('/login');
    }
  }, [isLoading, isAuthenticated, currentUser, router]);

  // Loading authentication state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#090D16] flex items-center justify-center p-4 antialiased">
        <div className="flex flex-col items-center gap-3">
          <CredLinkLogo size="md" className="animate-pulse" />
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Verifying CredLink Authorization...
          </p>
        </div>
      </div>
    );
  }

  // Unauthenticated — show redirecting indicator while router executes replace
  if (!isAuthenticated || !currentUser) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#090D16] flex items-center justify-center p-4 antialiased">
        <div className="flex flex-col items-center gap-3">
          <CredLinkLogo size="md" className="animate-pulse" />
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Protected area. Redirecting to login...
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

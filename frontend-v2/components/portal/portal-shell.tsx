'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { ChevronRight, Info, LogOut, Menu, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { navForRole, navLabel, roleLabel } from '@/components/portal/nav';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/ui/logo';
import { useDemo } from '@/lib/demo/demo-provider';
import { cn, initials } from '@/lib/utils';

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { account, profile } = useDemo();
  const items = navForRole(profile?.role ?? account?.role ?? null);

  const groups: { key: 'workspace' | 'network' | 'account'; label: string }[] = [
    { key: 'workspace', label: 'Workspace' },
    { key: 'network', label: 'Network' },
    { key: 'account', label: 'Account' },
  ];

  return (
    <nav aria-label="Portal sections" className="flex flex-col gap-6">
      {groups.map((group) => {
        const groupItems = items.filter((item) => item.group === group.key);
        if (groupItems.length === 0) return null;
        return (
          <div key={group.key}>
            <p className="px-3 text-micro font-semibold uppercase tracking-[0.12em] text-ink-500">{group.label}</p>
            <ul className="mt-2 flex flex-col gap-0.5">
              {groupItems.map((item) => {
                const active =
                  pathname === item.href ||
                  (item.also ?? []).some((href) => pathname.startsWith(href)) ||
                  (item.href !== '/portal' && pathname.startsWith(`${item.href}/`));
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      aria-current={active ? 'page' : undefined}
                      className={cn(
                        'flex items-center justify-between gap-2 rounded-control px-3 py-2 text-ui transition-colors',
                        active
                          ? 'bg-forest-50 font-medium text-forest-800'
                          : 'text-ink-600 hover:bg-paper-100 hover:text-ink-950',
                      )}
                    >
                      {navLabel(item, profile?.role ?? account?.role ?? null)}
                      {active ? <ChevronRight aria-hidden className="size-3.5" /> : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </nav>
  );
}

function ContextCard() {
  const { account, organization, profile } = useDemo();
  const role = profile?.role ?? account?.role ?? null;
  if (!profile || !role) return null;
  return (
    <div className="rounded-panel border border-line-200 bg-paper-50 p-3">
      <div className="flex items-center gap-2.5">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-forest-800 text-micro font-semibold text-white">
          {initials(profile.fullName)}
        </span>
        <div className="min-w-0">
          <p className="truncate text-ui font-medium text-ink-950">{profile.fullName}</p>
          <p className="truncate text-micro text-ink-500">{roleLabel[role]}</p>
        </div>
      </div>
      <p className="mt-2.5 border-t border-line-200 pt-2.5 text-micro leading-relaxed text-ink-600">
        {organization ? organization.name : 'No organization in this context'}
      </p>
    </div>
  );
}

export function PortalShell({ children }: { children: React.ReactNode }) {
  const { account, mode, profile, ready, leave } = useDemo();
  const router = useRouter();
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  const liveUnauthenticated = ready && mode === 'live' && !profile;

  useEffect(() => {
    if (liveUnauthenticated) router.replace('/login');
  }, [liveUnauthenticated, router]);

  const exit = () => {
    void leave().then(() => router.push('/login'));
  };

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper-50">
        <p className="text-ui text-ink-500">{mode === 'live' ? 'Restoring your session…' : 'Preparing the preview context…'}</p>
      </div>
    );
  }

  // Live mode without a session: redirect to sign-in rather than showing mock data.
  if (liveUnauthenticated) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-paper-50 px-6 text-center">
        <Logo />
        <div className="max-w-md">
          <h1 className="type-display text-h2 text-ink-950">Session required</h1>
          <p className="mt-3 text-body text-ink-600">Your session has ended. Redirecting you to sign in…</p>
        </div>
        <Link
          href="/login"
          className="inline-flex h-11 items-center rounded-control bg-forest-800 px-5 text-body font-medium text-white transition-colors hover:bg-forest-700"
        >
          Go to sign in
        </Link>
      </div>
    );
  }

  // Demo mode without a selected context: keep the original preview chooser step.
  if (!profile) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-paper-50 px-6 text-center">
        <Logo />
        <div className="max-w-md">
          <h1 className="type-display text-h2 text-ink-950">Choose a preview context first</h1>
          <p className="mt-3 text-body text-ink-600">
            The portal shows synthetic data scoped to a role. Nothing here is a session: no token is issued and no
            credential is exchanged.
          </p>
        </div>
        <Link
          href="/login"
          className="inline-flex h-11 items-center rounded-control bg-forest-800 px-5 text-body font-medium text-white transition-colors hover:bg-forest-700"
        >
          Open the preview contexts
        </Link>
      </div>
    );
  }

  const role = profile.role;

  return (
    <div className="min-h-screen bg-paper-50">
      {mode === 'demo' ? (
        <div className="flex items-center justify-center gap-2 border-b border-warning-700/20 bg-warning-50 px-4 py-1.5 text-center text-micro text-warning-700">
          <Info aria-hidden className="size-3.5 shrink-0" />
          <p>
            Synthetic demo data — no backend session, scoped as{' '}
            <span className="font-medium">{profile.fullName}</span> ({roleLabel[role]}).
          </p>
        </div>
      ) : null}

      <div className="mx-auto flex w-full max-w-app">
        <aside className="sticky top-0 hidden h-[calc(100svh-34px)] w-[264px] shrink-0 flex-col justify-between border-r border-line-200 bg-paper-0 px-3 py-4 lg:flex">
          <div>
            <div className="px-3 pb-5">
              <Link href="/" aria-label="CredLink home" className="rounded-control">
                <Logo />
              </Link>
            </div>
            <NavList />
          </div>
          <div className="flex flex-col gap-3">
            <ContextCard />
            <div className="flex items-center justify-between gap-2 px-1">
              <Link href="/" className="text-micro text-ink-500 transition-colors hover:text-ink-950">
                Back to the public site
              </Link>
              <button
                type="button"
                onClick={exit}
                className="inline-flex items-center gap-1.5 rounded-control px-2 py-1 text-micro text-ink-600 transition-colors hover:bg-paper-100 hover:text-ink-950"
              >
                <LogOut aria-hidden className="size-3.5" />
                {mode === 'demo' ? 'Exit preview' : 'Sign out'}
              </button>
            </div>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-40 flex items-center justify-between gap-3 border-b border-line-200 bg-paper-0/95 px-4 py-3 backdrop-blur lg:hidden">
            <Link href="/portal" aria-label="CredLink portal">
              <Logo showWordmark={false} />
            </Link>
            <p className="truncate text-ui font-medium text-ink-950">{profile.fullName}</p>
            <button
              type="button"
              onClick={() => setDrawerOpen((value) => !value)}
              aria-expanded={drawerOpen}
              aria-controls="portal-drawer"
              aria-label={drawerOpen ? 'Close navigation' : 'Open navigation'}
              className="rounded-control border border-line-300 p-2 text-ink-800"
            >
              {drawerOpen ? <X aria-hidden className="size-4" /> : <Menu aria-hidden className="size-4" />}
            </button>
          </header>

          <AnimatePresence>
            {drawerOpen ? (
              <motion.div
                id="portal-drawer"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                className="overflow-hidden border-b border-line-200 bg-paper-0 lg:hidden"
              >
                <div className="flex flex-col gap-5 px-4 py-4">
                  <ContextCard />
                  <NavList onNavigate={() => setDrawerOpen(false)} />
                  <Button variant="secondary" className="w-full" onClick={exit}>
                    {mode === 'demo' ? 'Exit preview' : 'Sign out'}
                  </Button>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>

          <main id="main" className="container-app py-6 lg:py-10">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
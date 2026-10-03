'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { createDataClient } from '@/lib/data';
import type { ActorContext, DataClient } from '@/lib/data/types';
import { demoAccounts, organizationsById, profileById, type DemoAccountSeed } from '@/lib/mock/fixtures';
import type { OrganizationSummary, ProfileRecord } from '@/lib/types';

/**
 * The demo context selector.
 *
 * This is deliberately NOT a session. It stores which synthetic account the visitor
 * is browsing as, so the portal can show realistic role-scoped data without an
 * authentication service. It mints no token, persists no credential, and the shell
 * labels it as a preview at all times. When the live API is connected this provider
 * is replaced by a real session provider and `useDataClient` returns a token-scoped
 * client instead.
 */

const STORAGE_KEY = 'credlink.preview.context.v1';

interface DemoContextValue {
  ready: boolean;
  account: DemoAccountSeed | null;
  profile: ProfileRecord | null;
  organization: OrganizationSummary | null;
  actor: ActorContext | null;
  client: DataClient;
  enter: (account: DemoAccountSeed) => void;
  leave: () => void;
}

const DemoContext = createContext<DemoContextValue | null>(null);

function actorFor(seed: DemoAccountSeed | null): ActorContext | null {
  if (!seed) return null;
  const profile = profileById[profileIdFor(seed) ?? ''];
  if (!profile) return null;
  return {
    userId: profile.id,
    role: profile.role,
    accountStatus: profile.accountStatus,
    organizationId: seed.organizationId,
    memberRole: seed.memberRole,
  };
}

export function profileIdFor(seed: DemoAccountSeed): string | null {
  const match = Object.values(profileById).find((profile) => profile.email.toLowerCase() === seed.email.toLowerCase());
  return match?.id ?? null;
}

export function DemoProvider({ children }: { children: React.ReactNode }) {
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored && demoAccounts.some((account) => account.key === stored)) setSelectedKey(stored);
    } catch {
      // Storage can be unavailable (private mode, blocked cookies). The preview still works.
    }
    setReady(true);
  }, []);

  const enter = useCallback((account: DemoAccountSeed) => {
    setSelectedKey(account.key);
    try {
      window.localStorage.setItem(STORAGE_KEY, account.key);
    } catch {
      // Non-fatal: the context simply will not survive a reload.
    }
  }, []);

  const leave = useCallback(() => {
    setSelectedKey(null);
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Non-fatal.
    }
  }, []);

  const account = useMemo(() => demoAccounts.find((item) => item.key === selectedKey) ?? null, [selectedKey]);
  const actor = useMemo(() => actorFor(account), [account]);
  const profile = useMemo(() => (account ? profileById[profileIdFor(account) ?? ''] ?? null : null), [account]);
  const organization = useMemo(
    () => (account?.organizationId ? organizationsById[account.organizationId] ?? null : null),
    [account],
  );
  const client = useMemo(() => createDataClient(actor), [actor]);

  const value = useMemo<DemoContextValue>(
    () => ({ ready, account, profile, organization, actor, client, enter, leave }),
    [ready, account, profile, organization, actor, client, enter, leave],
  );

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}

export function useDemo(): DemoContextValue {
  const context = useContext(DemoContext);
  if (!context) throw new Error('useDemo must be used inside DemoProvider');
  return context;
}

/** Convenience for portal screens: the scoped data client for the selected context. */
export function useDataClient(): DataClient {
  return useDemo().client;
}
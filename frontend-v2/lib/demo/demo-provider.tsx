'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { createDataClient, SESSION_EXPIRED_EVENT, setLiveActor } from '@/lib/data';
import type { ActorContext, DataClient } from '@/lib/data/types';
import { demoAccounts, organizationsById, profileById, type DemoAccountSeed } from '@/lib/mock/fixtures';
import type { AuthUserRecord, MemberRole, OrganizationMembership, OrganizationSummary, ProfileRecord } from '@/lib/types';

/**
 * The single owner of session state.
 *
 * Live mode is a real session: the browser holds an HttpOnly cookie, this provider
 * bootstraps identity from `/api/auth/me`, and `useDataClient()` returns a client
 * that calls same-origin route handlers. Demo mode is the preserved design preview:
 * it mints no token, stores no credential, and is always labelled as synthetic.
 *
 * Live and demo are mutually exclusive. Live authentication never silently falls
 * back to the mock, and a live failure never renders as a demo success.
 */

const STORAGE_KEY = 'credlink.preview.context.v1';

export type SessionMode = 'live' | 'demo';
export type SessionStatus = 'loading' | 'authenticated' | 'anonymous' | 'expired';

export interface SignInFeedback {
  ok: boolean;
  error?: string;
  details?: { field: string; message: string }[];
}

interface DemoContextValue {
  ready: boolean;
  mode: SessionMode;
  sessionStatus: SessionStatus;
  account: DemoAccountSeed | null;
  profile: ProfileRecord | null;
  organization: OrganizationSummary | null;
  actor: ActorContext | null;
  client: DataClient;
  enter: (account: DemoAccountSeed) => void;
  leave: () => Promise<void>;
  signIn: (input: { email: string; password: string; simulateOffline?: boolean }) => Promise<SignInFeedback>;
  refreshSession: () => Promise<void>;
}

const DemoContext = createContext<DemoContextValue | null>(null);

function profileIdForSeed(seed: DemoAccountSeed): string | null {
  const match = Object.values(profileById).find((profile) => profile.email.toLowerCase() === seed.email.toLowerCase());
  return match?.id ?? null;
}

export function profileIdFor(seed: DemoAccountSeed): string | null {
  return profileIdForSeed(seed);
}

function actorForSeed(seed: DemoAccountSeed | null): ActorContext | null {
  if (!seed) return null;
  const profile = profileById[profileIdForSeed(seed) ?? ''];
  if (!profile) return null;
  return {
    userId: profile.id,
    role: profile.role,
    accountStatus: profile.accountStatus,
    organizationId: seed.organizationId,
    memberRole: seed.memberRole,
  };
}

function primaryMembership(memberships: OrganizationMembership[], organizationId: string | null): OrganizationMembership | null {
  if (!memberships.length) return null;
  if (organizationId) return memberships.find((item) => item.organization.id === organizationId) ?? memberships[0];
  return memberships[0];
}

function actorForUser(user: AuthUserRecord, memberships: OrganizationMembership[]): ActorContext {
  const membership = primaryMembership(memberships, user.organizationId);
  return {
    userId: user.id,
    role: user.role,
    accountStatus: user.status,
    organizationId: user.organizationId,
    memberRole: (membership?.memberRole ?? null) as MemberRole | null,
  };
}

function profileForUser(user: AuthUserRecord): ProfileRecord {
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    phone: user.phone ?? null,
    role: user.role,
    accountStatus: user.status,
    createdAt: user.createdAt ?? '',
    updatedAt: user.createdAt ?? '',
  };
}

function organizationForUser(user: AuthUserRecord, memberships: OrganizationMembership[]): OrganizationSummary | null {
  if (!user.organizationId) return null;
  const membership = primaryMembership(memberships, user.organizationId);
  if (membership) return membership.organization;
  return {
    id: user.organizationId,
    name: user.organizationName,
    code: user.organizationCode ?? '',
    domain: user.organizationDomain ?? 'college',
    did: user.organizationDid,
    verificationStatus: user.organizationStatus ?? 'PENDING',
    isIssuer: user.isIssuer,
    authorizedCredentialTypes: user.authorizedCredentialTypes,
    registrationRef: null,
    createdAt: user.createdAt ?? '',
  };
}

export function DemoProvider({ children }: { children: React.ReactNode }) {
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [storageChecked, setStorageChecked] = useState(false);
  const [liveStatus, setLiveStatus] = useState<SessionStatus>('loading');
  const [liveUser, setLiveUser] = useState<AuthUserRecord | null>(null);
  const [liveMemberships, setLiveMemberships] = useState<OrganizationMembership[]>([]);
  const [bootstrapNonce, setBootstrapNonce] = useState(0);

  // Restore the preview context selection (demo mode only).
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored && demoAccounts.some((account) => account.key === stored)) setSelectedKey(stored);
    } catch {
      // Storage can be unavailable (private mode, blocked cookies). The preview still works.
    }
    setStorageChecked(true);
  }, []);

  // Bootstrap the live session from the HttpOnly cookie.
  useEffect(() => {
    let active = true;
    setLiveStatus((current) => (current === 'loading' ? 'loading' : current));
    (async () => {
      try {
        const response = await fetch('/api/auth/me', { cache: 'no-store', credentials: 'same-origin' });
        const payload = await response.json().catch(() => null);
        if (!active) return;
        if (response.ok && payload?.success && payload.data?.user) {
          setLiveUser(payload.data.user as AuthUserRecord);
          setLiveMemberships(Array.isArray(payload.data.memberships) ? (payload.data.memberships as OrganizationMembership[]) : []);
          setLiveStatus('authenticated');
        } else {
          setLiveUser(null);
          setLiveMemberships([]);
          setLiveStatus((current) => (current === 'authenticated' ? 'expired' : 'anonymous'));
        }
      } catch {
        if (!active) return;
        setLiveStatus((current) => (current === 'authenticated' ? 'expired' : 'anonymous'));
      }
    })();
    return () => {
      active = false;
    };
  }, [bootstrapNonce]);

  // React once when any proxied call reports an expired session.
  useEffect(() => {
    const handler = () => {
      setLiveUser(null);
      setLiveMemberships([]);
      setLiveStatus('expired');
    };
    window.addEventListener(SESSION_EXPIRED_EVENT, handler);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, handler);
  }, []);

  const enter = useCallback((account: DemoAccountSeed) => {
    setSelectedKey(account.key);
    try {
      window.localStorage.setItem(STORAGE_KEY, account.key);
    } catch {
      // Non-fatal: the context simply will not survive a reload.
    }
  }, []);

  const account = useMemo(() => demoAccounts.find((item) => item.key === selectedKey) ?? null, [selectedKey]);
  const mode: SessionMode = account ? 'demo' : 'live';

  const demoActor = useMemo(() => actorForSeed(account), [account]);
  const liveActor = useMemo(
    () => (liveUser ? actorForUser(liveUser, liveMemberships) : null),
    [liveUser, liveMemberships],
  );
  const actor = mode === 'demo' ? demoActor : liveActor;

  const profile = useMemo<ProfileRecord | null>(() => {
    if (mode === 'demo') return account ? profileById[profileIdForSeed(account) ?? ''] ?? null : null;
    return liveUser ? profileForUser(liveUser) : null;
  }, [mode, account, liveUser]);

  const organization = useMemo<OrganizationSummary | null>(() => {
    if (mode === 'demo') return account?.organizationId ? organizationsById[account.organizationId] ?? null : null;
    return liveUser ? organizationForUser(liveUser, liveMemberships) : null;
  }, [mode, account, liveUser, liveMemberships]);

  // The live client needs the current organization for institution-scoped writes.
  useEffect(() => {
    setLiveActor(liveActor ? { organizationId: liveActor.organizationId } : null);
  }, [liveActor]);

  const client = useMemo(() => createDataClient(mode === 'demo' ? demoActor : null), [mode, demoActor]);

  const refreshSession = useCallback(async () => {
    setBootstrapNonce((value) => value + 1);
  }, []);

  const signIn = useCallback<DemoContextValue['signIn']>(
    async (input) => {
      try {
        const response = await client.signIn(input);
        if (!response.success || !response.data) {
          return { ok: false, error: response.error, details: response.details };
        }
        setSelectedKey(null);
        try {
          window.localStorage.removeItem(STORAGE_KEY);
        } catch {
          // Non-fatal.
        }
        setLiveUser(response.data.user);
        setLiveMemberships(response.data.memberships);
        setLiveStatus('authenticated');
        return { ok: true };
      } catch (error) {
        return { ok: false, error: error instanceof Error ? error.message : 'Sign-in failed.' };
      }
    },
    [client],
  );

  const leave = useCallback(async () => {
    if (mode === 'demo') {
      setSelectedKey(null);
      try {
        window.localStorage.removeItem(STORAGE_KEY);
      } catch {
        // Non-fatal.
      }
      return;
    }
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' });
    } catch {
      // Clearing local state is what matters; the backend session will expire.
    }
    setLiveUser(null);
    setLiveMemberships([]);
    setLiveStatus('anonymous');
  }, [mode]);

  const ready = storageChecked && liveStatus !== 'loading';

  const value = useMemo<DemoContextValue>(
    () => ({ ready, mode, sessionStatus: liveStatus, account, profile, organization, actor, client, enter, leave, signIn, refreshSession }),
    [ready, mode, liveStatus, account, profile, organization, actor, client, enter, leave, signIn, refreshSession],
  );

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}

export function useDemo(): DemoContextValue {
  const context = useContext(DemoContext);
  if (!context) throw new Error('useDemo must be used inside DemoProvider');
  return context;
}

/** Convenience for portal screens: the scoped data client for the current mode. */
export function useDataClient(): DataClient {
  return useDemo().client;
}
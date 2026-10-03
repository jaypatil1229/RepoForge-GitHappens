'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserRole, CurrentUser } from '../types';
import { apiClient, LoginInput, OrganizationMembership } from '../../../../packages/api-client';

export function deriveUserRole(userRoleAttr?: string, orgDomainAttr?: string): UserRole {
  const role = userRoleAttr?.toUpperCase();
  if (role === 'ADMIN') return 'ADMIN';
  if (role === 'CITIZEN') return 'CITIZEN';
  if (orgDomainAttr) {
    const d = orgDomainAttr.toUpperCase();
    if (d === 'HOSPITAL' || d === 'HEALTHCARE') return 'HOSPITAL';
    if (d === 'COLLEGE' || d === 'EDUCATION') return 'COLLEGE';
    if (d === 'BANK' || d === 'FINANCE') return 'BANK';
    if (d === 'EMPLOYER') return 'EMPLOYER';
    if (d === 'ADMIN') return 'ADMIN';
  }
  if (role) {
    if (role === 'HOSPITAL' || role === 'HEALTHCARE') return 'HOSPITAL';
    if (role === 'COLLEGE' || role === 'EDUCATION') return 'COLLEGE';
    if (role === 'BANK' || role === 'FINANCE') return 'BANK';
    if (role === 'EMPLOYER') return 'EMPLOYER';
  }
  return 'CITIZEN';
}

interface RoleContextType {
  currentUser: CurrentUser | null;
  switchRole: (role: UserRole) => void;
  activeOrgDid: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  memberships: OrganizationMembership[];
  login: (credentials: LoginInput) => Promise<UserRole | null>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

function resolveUserFromBackend(user: any, userOrgs: OrganizationMembership[]): { currentUser: CurrentUser; memberships: OrganizationMembership[] } {
  const primaryOrg = userOrgs[0]?.organization;
  const resolvedOrgId = user.organizationId || primaryOrg?.id || undefined;
  const resolvedOrgName = user.organizationName || primaryOrg?.name || (user.role === 'ADMIN' ? 'CredLink Network Governance' : 'Unaffiliated Citizen');
  const resolvedOrgCode = user.organizationCode || primaryOrg?.code || (user.role === 'ADMIN' ? 'GOV-ROOT' : undefined);
  const resolvedOrgDomain = user.organizationDomain || primaryOrg?.domain || (user.role === 'ADMIN' ? 'admin' : undefined);
  const resolvedOrgDid = user.organizationDid || primaryOrg?.did || (user.role === 'ADMIN' ? 'did:credlink:governance:root' : (user.id ? `did:credlink:citizen:${user.id}` : 'did:credlink:citizen:unaffiliated'));
  const resolvedOrgStatus = (user.organizationStatus as any) || (primaryOrg as any)?.verification_status || (primaryOrg as any)?.status || (user.role === 'ADMIN' ? 'APPROVED' : undefined);
  const resolvedIsIssuer = user.isIssuer ?? (primaryOrg?.is_issuer ?? false);
  const resolvedAuthorizedTypes = user.authorizedCredentialTypes || primaryOrg?.authorizedCredentialTypes || primaryOrg?.authorized_credential_types || [];
  const userRole = deriveUserRole(user.role, resolvedOrgDomain);

  return {
    currentUser: {
      id: user.id,
      name: user.fullName || user.email,
      email: user.email,
      role: userRole,
      organizationName: resolvedOrgName,
      organizationDid: resolvedOrgDid,
      organizationId: resolvedOrgId,
      organizationCode: resolvedOrgCode,
      organizationDomain: resolvedOrgDomain,
      organizationStatus: resolvedOrgStatus,
      isIssuer: resolvedIsIssuer,
      authorizedCredentialTypes: resolvedAuthorizedTypes,
    },
    memberships: userOrgs,
  };
}

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [memberships, setMemberships] = useState<OrganizationMembership[]>([]);

  // Restore session from stored JWT token on startup
  useEffect(() => {
    let isMounted = true;

    async function initSession() {
      try {
        const storedToken = typeof window !== 'undefined' ? localStorage.getItem('credlink_auth_token') : null;

        if (!storedToken) {
          if (isMounted) setIsLoading(false);
          return;
        }

        apiClient.setToken(storedToken);
        const meRes = await apiClient.getMe();

        if (meRes.success && meRes.data && isMounted) {
          const resolved = resolveUserFromBackend(meRes.data.user, meRes.data.memberships || []);
          setCurrentUser(resolved.currentUser);
          setMemberships(resolved.memberships);
          setIsAuthenticated(true);
        } else if (isMounted) {
          // Token expired or invalid
          localStorage.removeItem('credlink_auth_token');
          apiClient.setToken(null);
        }
      } catch {
        // Backend unreachable — clear token
        if (isMounted && typeof window !== 'undefined') {
          localStorage.removeItem('credlink_auth_token');
          apiClient.setToken(null);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    initSession();
    return () => { isMounted = false; };
  }, []);

  const login = async (credentials: LoginInput): Promise<UserRole | null> => {
    setError(null);
    try {
      const res = await apiClient.login(credentials);
      if (res.success && res.data) {
        const { user, session, memberships: userOrgs } = res.data;
        if (session?.access_token && typeof window !== 'undefined') {
          localStorage.setItem('credlink_auth_token', session.access_token);
        }

        const resolved = resolveUserFromBackend(user, userOrgs);
        setCurrentUser(resolved.currentUser);
        setMemberships(resolved.memberships);
        setIsAuthenticated(true);
        return resolved.currentUser.role;
      }
      return null;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Login failed. Please check your credentials.';
      setError(message);
      return null;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      const currentToken = apiClient.getToken();
      if (currentToken) {
        await apiClient.logout(currentToken);
      }
    } catch {
      // Ignore network errors on logout
    } finally {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('credlink_auth_token');
      }
      apiClient.setToken(null);
      setCurrentUser(null);
      setMemberships([]);
      setIsAuthenticated(false);
    }
  };

  const switchRole = (role: UserRole) => {
    if (!currentUser) return;

    const matchingMembership = memberships.find((m) => {
      const domainRole = deriveUserRole(undefined, m.organization?.domain);
      return domainRole === role;
    });

    if (matchingMembership?.organization) {
      const org = matchingMembership.organization;
      const orgStatus = (org as any).verification_status || (org as any).status || 'APPROVED';
      setCurrentUser((prev) =>
        prev
          ? {
              ...prev,
              role,
              organizationId: org.id,
              organizationName: org.name,
              organizationCode: org.code,
              organizationDomain: org.domain,
              organizationDid: org.did,
              organizationStatus: orgStatus,
              isIssuer: org.is_issuer ?? false,
              authorizedCredentialTypes: (org as any).authorizedCredentialTypes || (org as any).authorized_credential_types || [],
            }
          : null
      );
    }
  };

  const clearError = () => setError(null);

  return (
    <RoleContext.Provider
      value={{
        currentUser,
        switchRole,
        activeOrgDid: currentUser?.organizationDid || null,
        isAuthenticated,
        isLoading,
        error,
        memberships,
        login,
        logout,
        clearError,
      }}
    >
      {children}
    </RoleContext.Provider>
  );
}

export function useRoleContext() {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error('useRoleContext must be used within a RoleProvider');
  }
  return context;
}

'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import {
  clearWalletSession,
  fetchWalletConsents,
  fetchWalletCredentials,
  getWalletAccessToken,
  getWalletUser,
  loginWallet,
  logoutWallet,
  resolveWalletQr,
  respondToConsent,
  walletRealtimeConfig,
  type ResolvedConsentRequest,
  type WalletConsent,
  type WalletCredential,
  type WalletUser,
} from './wallet-api'

type SessionState = 'loading' | 'signed-out' | 'signed-in'
type SyncState = 'realtime' | 'polling' | 'offline'

type WalletContextValue = {
  sessionState: SessionState
  user: WalletUser | null
  credentials: WalletCredential[]
  consents: WalletConsent[]
  dataLoading: boolean
  currentRequest: ResolvedConsentRequest | null
  syncState: SyncState
  dataError: string | null
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  refreshData: () => Promise<void>
  scanPayload: (payload: string) => Promise<ResolvedConsentRequest>
  respond: (id: string, action: 'APPROVE' | 'DENY', approvedClaims: string[]) => Promise<void>
  clearCurrentRequest: () => void
}

const WalletContext = createContext<WalletContextValue | null>(null)

export function useWallet() {
  const value = useContext(WalletContext)
  if (!value) throw new Error('useWallet must be used inside WalletProvider.')
  return value
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const [sessionState, setSessionState] = useState<SessionState>('loading')
  const [user, setUser] = useState<WalletUser | null>(null)
  const [credentials, setCredentials] = useState<WalletCredential[]>([])
  const [consents, setConsents] = useState<WalletConsent[]>([])
  const [dataLoading, setDataLoading] = useState(false)
  const [currentRequest, setCurrentRequest] = useState<ResolvedConsentRequest | null>(null)
  const [syncState, setSyncState] = useState<SyncState>('polling')
  const [dataError, setDataError] = useState<string | null>(null)
  const realtimeActive = useRef(false)

  const userId = user?.id
  const refreshData = useCallback(async () => {
    if (!userId) return
    setDataLoading(true)
    try {
      const [nextUser, nextCredentials, nextConsents] = await Promise.all([
        getWalletUser(),
        fetchWalletCredentials(userId),
        fetchWalletConsents(userId),
      ])
      setUser((current) => current &&
        current.id === nextUser.id &&
        current.email === nextUser.email &&
        current.fullName === nextUser.fullName &&
        current.phone === nextUser.phone &&
        current.role === nextUser.role &&
        current.status === nextUser.status
        ? current
        : nextUser)
      setCredentials(nextCredentials)
      setConsents(nextConsents)
      setDataError(null)
      setSyncState(realtimeActive.current ? 'realtime' : 'polling')
    } catch (error) {
      setDataError(error instanceof Error ? error.message : 'Could not refresh wallet data.')
      setSyncState('offline')
      if (!getWalletAccessToken()) {
        setUser(null)
        setSessionState('signed-out')
      }
      throw error
    } finally {
      setDataLoading(false)
    }
  }, [userId])

  const acceptUser = useCallback(async (nextUser: WalletUser) => {
    setUser(nextUser)
    setSessionState('signed-in')
    setDataLoading(true)
    try {
      const [nextCredentials, nextConsents] = await Promise.all([
        fetchWalletCredentials(nextUser.id),
        fetchWalletConsents(nextUser.id),
      ])
      setCredentials(nextCredentials)
      setConsents(nextConsents)
      setDataError(null)
    } catch (error) {
      setDataError(error instanceof Error ? error.message : 'Could not load wallet data.')
    } finally {
      setDataLoading(false)
    }
  }, [])

  useEffect(() => {
    let active = true
    void (async () => {
      if (!getWalletAccessToken()) {
        if (active) setSessionState('signed-out')
        return
      }
      try {
        const restoredUser = await getWalletUser()
        if (active) await acceptUser(restoredUser)
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Could not restore your session.'
        if (!active) return
        if (!getWalletAccessToken()) {
          clearWalletSession()
          setUser(null)
          setSessionState('signed-out')
          setDataError(message)
        } else {
          setDataError(message)
          setSessionState('signed-out')
        }
      }
    })()
    return () => { active = false }
  }, [acceptUser])

  const signIn = useCallback(async (email: string, password: string) => {
    const nextUser = await loginWallet(email, password)
    await acceptUser(nextUser)
  }, [acceptUser])

  const signOut = useCallback(async () => {
    let logoutError: string | null = null
    try {
      await logoutWallet()
    } catch (error) {
      logoutError = error instanceof Error
        ? `Signed out on this device, but the backend logout failed: ${error.message}`
        : 'Signed out on this device, but the backend session could not be revoked.'
    } finally {
      setUser(null)
      setCredentials([])
      setConsents([])
      setCurrentRequest(null)
      setDataLoading(false)
      setDataError(logoutError)
      setSessionState('signed-out')
      setSyncState('polling')
    }
  }, [])

  const scanPayload = useCallback(async (payload: string) => {
    const request = await resolveWalletQr(payload)
    setCurrentRequest(request)
    return request
  }, [])

  const respond = useCallback(async (id: string, action: 'APPROVE' | 'DENY', approvedClaims: string[]) => {
    const updated = await respondToConsent(id, action, approvedClaims)
    setConsents((current) => [updated, ...current.filter((consent) => consent.id !== updated.id)])
    setCurrentRequest(null)
    void refreshData().catch(() => {})
  }, [refreshData])

  const clearCurrentRequest = useCallback(() => setCurrentRequest(null), [])

  useEffect(() => {
    if (!user) return
    realtimeActive.current = false
    setSyncState('polling')
    let client: SupabaseClient | null = null
    let refreshTimer: ReturnType<typeof setInterval>
    let previousRealtimeToken = getWalletAccessToken()
    const refreshIfVisible = () => {
      if (document.visibilityState !== 'visible') return
      void refreshData().then(() => {
        const accessToken = getWalletAccessToken()
        if (client && accessToken && accessToken !== previousRealtimeToken) {
          previousRealtimeToken = accessToken
          client.realtime.setAuth(accessToken)
        }
      }).catch(() => {})
    }

    refreshTimer = setInterval(refreshIfVisible, 15000)
    window.addEventListener('focus', refreshIfVisible)
    document.addEventListener('visibilitychange', refreshIfVisible)

    let disposed = false
    const accessToken = previousRealtimeToken
    const { url, publishableKey } = walletRealtimeConfig

    if (url && publishableKey && accessToken) {
      try {
        client = createClient(url, publishableKey, {
          auth: { persistSession: false, autoRefreshToken: false },
          realtime: { params: { eventsPerSecond: 5 } },
        })
        client.realtime.setAuth(accessToken)
        const channel = client
          .channel(`wallet:${user.id}`)
          .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles', filter: `id=eq.${user.id}` }, refreshIfVisible)
          .on('postgres_changes', { event: '*', schema: 'public', table: 'credentials', filter: `subject_id=eq.${user.id}` }, refreshIfVisible)
          .on('postgres_changes', { event: '*', schema: 'public', table: 'consents', filter: `citizen_id=eq.${user.id}` }, refreshIfVisible)
          .subscribe((status) => {
            if (disposed) return
            if (status === 'SUBSCRIBED') {
              realtimeActive.current = true
              setSyncState('realtime')
              refreshIfVisible()
            } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
              realtimeActive.current = false
              setSyncState('polling')
            }
          })
        return () => {
          disposed = true
          realtimeActive.current = false
          clearInterval(refreshTimer)
          window.removeEventListener('focus', refreshIfVisible)
          document.removeEventListener('visibilitychange', refreshIfVisible)
          if (client) void client.removeChannel(channel)
        }
      } catch (error) {
        console.error('Wallet Realtime setup failed; continuing with periodic API refresh.', error)
      }
    }

    setSyncState('polling')
    return () => {
      disposed = true
      clearInterval(refreshTimer)
      window.removeEventListener('focus', refreshIfVisible)
      document.removeEventListener('visibilitychange', refreshIfVisible)
      if (client) void client.removeAllChannels()
    }
  }, [user, refreshData])

  const value = useMemo<WalletContextValue>(() => ({
    sessionState,
    user,
    credentials,
    consents,
    dataLoading,
    currentRequest,
    syncState,
    dataError,
    signIn,
    signOut,
    refreshData,
    scanPayload,
    respond,
    clearCurrentRequest,
  }), [
    sessionState, user, credentials, consents, dataLoading, currentRequest, syncState, dataError,
    signIn, signOut, refreshData, scanPayload, respond, clearCurrentRequest,
  ])

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
}

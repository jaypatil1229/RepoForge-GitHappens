'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { BottomNav, type Tab } from './primitives'
import { SplashScreen } from './screens/splash-screen'
import { HomeScreen } from './screens/home-screen'
import { CredentialDetailScreen } from './screens/credential-detail-screen'
import { ScanScreen } from './screens/scan-screen'
import { ConsentScreen } from './screens/consent-screen'
import { ProcessingScreen } from './screens/processing-screen'
import { ReceiptScreen } from './screens/receipt-screen'
import { ActivityScreen } from './screens/activity-screen'
import { ProfileScreen } from './screens/profile-screen'

export type Route =
  | { name: 'splash' }
  | { name: 'home'; notice?: string }
  | { name: 'credential'; id: string }
  | { name: 'scan' }
  | { name: 'consent' }
  | { name: 'processing' }
  | { name: 'receipt'; id: string; fromShare?: boolean }
  | { name: 'activity' }
  | { name: 'profile' }

type Direction = 'forward' | 'back' | 'fade'

const tabRoutes: Tab[] = ['home', 'activity', 'profile']

export function WalletApp() {
  const [stack, setStack] = useState<Route[]>([{ name: 'splash' }])
  const [direction, setDirection] = useState<Direction>('fade')
  const [renderKey, setRenderKey] = useState(0)

  const route = stack[stack.length - 1]

  const push = (next: Route) => {
    setDirection('forward')
    setStack((s) => [...s, next])
    setRenderKey((k) => k + 1)
  }

  const replaceRoot = (next: Route, dir: Direction = 'fade') => {
    setDirection(dir)
    setStack([next])
    setRenderKey((k) => k + 1)
  }

  const back = () => {
    setDirection('back')
    setStack((s) => (s.length > 1 ? s.slice(0, -1) : [{ name: 'home' }]))
    setRenderKey((k) => k + 1)
  }

  const goTab = (tab: Tab) => {
    if (route.name === tab) return
    replaceRoot({ name: tab })
  }

  const activeTab = tabRoutes.find((t) => t === route.name)

  return (
    <main className="flex min-h-dvh justify-center bg-muted sm:items-center sm:py-8">
      <div className="relative flex h-dvh w-full flex-col overflow-hidden bg-background sm:h-[min(860px,calc(100dvh-4rem))] sm:max-w-[400px] sm:rounded-[2.5rem] sm:border sm:border-border sm:shadow-[0_24px_60px_-20px_rgba(20,33,29,0.18)]">
        <div
          key={renderKey}
          className={cn(
            'flex min-h-0 flex-1 flex-col animate-in duration-300 ease-out fade-in',
            direction === 'forward' && 'slide-in-from-right-6',
            direction === 'back' && 'slide-in-from-left-6',
          )}
        >
          {renderRoute(route, { push, back, replaceRoot })}
        </div>
        {activeTab && <BottomNav active={activeTab} onNavigate={goTab} />}
      </div>
    </main>
  )
}

export type Nav = {
  push: (route: Route) => void
  back: () => void
  replaceRoot: (route: Route, dir?: Direction) => void
}

function renderRoute(route: Route, nav: Nav) {
  switch (route.name) {
    case 'splash':
      return <SplashScreen nav={nav} />
    case 'home':
      return <HomeScreen nav={nav} notice={route.notice} />
    case 'credential':
      return <CredentialDetailScreen nav={nav} id={route.id} />
    case 'scan':
      return <ScanScreen nav={nav} />
    case 'consent':
      return <ConsentScreen nav={nav} />
    case 'processing':
      return <ProcessingScreen nav={nav} />
    case 'receipt':
      return <ReceiptScreen nav={nav} id={route.id} fromShare={route.fromShare} />
    case 'activity':
      return <ActivityScreen nav={nav} />
    case 'profile':
      return <ProfileScreen />
  }
}

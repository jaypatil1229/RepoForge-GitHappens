import type { Metadata, Viewport } from 'next';
import { MotionConfig } from 'framer-motion';

import { PWAInstallButton } from '@/components/pwa/install-button';
import { ServiceWorkerRegistration } from '@/components/pwa/service-worker-registration';
import { ToastProvider } from '@/components/ui/toast';
import { DemoProvider } from '@/lib/demo/demo-provider';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'CredLink — proof that moves with you',
    template: '%s — CredLink',
  },
  description:
    'Institutions issue verifiable credentials, people decide which claims to share, and recipients verify the proof behind them.',
  applicationName: 'CredLink',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'CredLink',
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon.png', sizes: '32x32', type: 'image/png' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: [{ url: '/apple-icon.png', sizes: '180x180', type: 'image/png' }],
  },
};

export const viewport: Viewport = {
  themeColor: '#102d24',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <noscript>
          {/*
            Framer serialises its initial styles into the server HTML. Without
            JavaScript nothing would animate them to their final value, so this
            reveals the resting state instead of leaving content invisible.
          */}
          <style>{`main [style*="opacity"], main [style*="transform"] { opacity: 1 !important; transform: none !important; }`}</style>
        </noscript>
        <MotionConfig reducedMotion="user">
          <DemoProvider>
            <ToastProvider>
              <ServiceWorkerRegistration />
              {children}
              <PWAInstallButton />
            </ToastProvider>
          </DemoProvider>
        </MotionConfig>
      </body>
    </html>
  );
}
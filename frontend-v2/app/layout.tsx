import type { Metadata, Viewport } from 'next';
import { MotionConfig } from 'framer-motion';

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
};

export const viewport: Viewport = {
  themeColor: '#102d24',
  width: 'device-width',
  initialScale: 1,
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
            <ToastProvider>{children}</ToastProvider>
          </DemoProvider>
        </MotionConfig>
      </body>
    </html>
  );
}
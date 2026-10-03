import type { Metadata, Viewport } from 'next';
import './globals.css';
import { RoleProvider } from '../hooks/useRoleContext';
import { ServiceWorkerRegistration } from '../components/pwa/ServiceWorkerRegistration';
import { PWAInstallButton } from '../components/pwa/PWAInstallButton';

export const metadata: Metadata = {
  title: 'CredLink — Unified Digital Identity & Record Network',
  description: 'Citizen-centric cross-domain digital identity & verifiable credential management platform.',
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
    apple: [
      { url: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: '#1B6B4A',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.png" type="image/png" sizes="32x32" />
        <link rel="apple-touch-icon" href="/apple-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="CredLink" />
      </head>
      <body className="h-full bg-slate-50 dark:bg-[#090D16] text-slate-900 dark:text-slate-100 antialiased">
        <RoleProvider>
          <ServiceWorkerRegistration />
          {children}
          <PWAInstallButton />
        </RoleProvider>
      </body>
    </html>
  );
}

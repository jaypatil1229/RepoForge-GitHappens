'use client';

import { Download, Share, X } from 'lucide-react';
import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISS_KEY = 'credlink.pwa.dismissed.v1';
const DISMISS_WINDOW_MS = 1000 * 60 * 60 * 24 * 30;

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

function wasDismissed(): boolean {
  try {
    const raw = window.localStorage.getItem(DISMISS_KEY);
    if (!raw) return false;
    return Date.now() - Number(raw) < DISMISS_WINDOW_MS;
  } catch {
    return false;
  }
}

/**
 * V2-styled install prompt. Shown only when the browser offers an install event
 * (or on iOS, where it does not), never while running standalone, and never in a
 * way that blocks the app. The dismissed state is remembered for 30 days.
 */
export function PWAInstallButton() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [iosHint, setIosHint] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || isStandalone() || wasDismissed()) return;

    const onPrompt = (event: Event) => {
      event.preventDefault();
      setDeferred(event as BeforeInstallPromptEvent);
      setVisible(true);
    };
    const onInstalled = () => {
      setVisible(false);
      try {
        window.localStorage.setItem(DISMISS_KEY, String(Date.now()));
      } catch {
        // Non-fatal.
      }
    };

    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);

    const ua = window.navigator.userAgent;
    const isIOS = /iPhone|iPad|iPod/.test(ua) && !(window as unknown as { MSStream?: unknown }).MSStream;
    if (isIOS) {
      setIosHint(true);
      setVisible(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const dismiss = () => {
    setVisible(false);
    try {
      window.localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      // Non-fatal.
    }
  };

  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice.catch(() => undefined);
    dismiss();
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Install CredLink"
      className="fixed inset-x-4 bottom-4 z-50 mx-auto flex max-w-md items-start gap-3 rounded-panel border border-line-200 bg-paper-0 p-4 shadow-lg sm:inset-x-auto sm:right-6 sm:bottom-6"
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-forest-800 text-white">
        <Download aria-hidden className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-ui font-medium text-ink-950">Install CredLink</p>
        <p className="mt-1 text-micro leading-relaxed text-ink-600">
          {iosHint
            ? 'Tap the Share button in your browser, then choose “Add to Home Screen”.'
            : 'Add the portal to your home screen for faster access and offline navigation.'}
        </p>
        {iosHint ? (
          <p className="mt-2 inline-flex items-center gap-1.5 text-micro text-ink-500">
            <Share aria-hidden className="size-3.5" /> Share → Add to Home Screen
          </p>
        ) : (
          <button
            type="button"
            onClick={install}
            className="mt-3 inline-flex h-9 items-center rounded-control bg-forest-800 px-4 text-ui font-medium text-white transition-colors hover:bg-forest-700"
          >
            Install app
          </button>
        )}
      </div>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss install prompt"
        className="rounded-control p-1 text-ink-500 transition-colors hover:bg-paper-100 hover:text-ink-950"
      >
        <X aria-hidden className="size-4" />
      </button>
    </div>
  );
}
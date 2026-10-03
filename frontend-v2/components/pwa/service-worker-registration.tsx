'use client';

import { useEffect } from 'react';

const RELOAD_FLAG = 'credlink.sw.reloaded';

/**
 * Registers the V2 service worker without blocking first render, and reloads once
 * when an updated worker takes control so users are never stuck on stale assets.
 * There is exactly one registration point for the app.
 */
export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    const register = () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          registration.update().catch(() => undefined);
          registration.addEventListener('updatefound', () => {
            const installing = registration.installing;
            if (!installing) return;
            installing.addEventListener('statechange', () => {
              if (installing.state === 'activated' && navigator.serviceWorker.controller) {
                try {
                  if (!window.sessionStorage.getItem(RELOAD_FLAG)) {
                    window.sessionStorage.setItem(RELOAD_FLAG, '1');
                    window.location.reload();
                  }
                } catch {
                  // Storage unavailable: skip the one-time reload.
                }
              }
            });
          });
        })
        .catch((error) => console.warn('[CredLink PWA] Service worker registration failed:', error));
    };

    if (document.readyState === 'complete') register();
    else window.addEventListener('load', register, { once: true });

    return () => window.removeEventListener('load', register);
  }, []);

  return null;
}
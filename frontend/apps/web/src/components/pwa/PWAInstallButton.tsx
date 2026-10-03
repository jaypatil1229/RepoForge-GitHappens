'use client';

import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone, Share2 } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/**
 * Detects if device is mobile via user agent and viewport width.
 */
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const ua = navigator.userAgent || '';
      const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
      const isNarrow = window.innerWidth < 768;
      setIsMobile(isMobileUA || isNarrow);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
}

function useIsIOS() {
  const [isIOS, setIsIOS] = useState(false);
  useEffect(() => {
    const ua = navigator.userAgent || '';
    setIsIOS(/iPhone|iPad|iPod/.test(ua) && !(window as any).MSStream);
  }, []);
  return isIOS;
}

/**
 * Floating bottom banner — MOBILE ONLY.
 * Shows install prompt on Android (via beforeinstallprompt) or iOS share sheet guidance.
 */
export function PWAInstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const isMobile = useIsMobile();
  const isIOS = useIsIOS();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if already running as standalone PWA
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
      || (window.navigator as any).standalone === true;
    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    // Check dismissal cooldown (24h)
    const dismissedAt = localStorage.getItem('credlink_pwa_dismissed');
    if (dismissedAt) {
      const dismissedTime = parseInt(dismissedAt, 10);
      if (Date.now() - dismissedTime < 24 * 60 * 60 * 1000) {
        setDismissed(true);
        return;
      }
    }

    // On iOS, show the iOS share sheet guidance instead
    if (isIOS) {
      // Delay showing to avoid flash
      const timer = setTimeout(() => setShowIOSGuide(true), 2000);
      return () => clearTimeout(timer);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowInstallBanner(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowInstallBanner(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [isIOS]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
    } catch (err) {
      console.warn('Install prompt error:', err);
    }
    setDeferredPrompt(null);
    setShowInstallBanner(false);
  };

  const handleDismiss = () => {
    setShowInstallBanner(false);
    setShowIOSGuide(false);
    setDismissed(true);
    if (typeof window !== 'undefined') {
      localStorage.setItem('credlink_pwa_dismissed', Date.now().toString());
    }
  };

  // MOBILE-ONLY: Don't render on desktop
  if (!isMobile) return null;
  // Don't render if installed, dismissed, or no prompt
  if (isInstalled || dismissed) return null;
  if (!showInstallBanner && !showIOSGuide) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[9999] px-3 pb-[calc(env(safe-area-inset-bottom,0px)+0.75rem)] pt-0">
      <div className="relative bg-gradient-to-r from-[#1B6B4A] via-[#22805A] to-[#38BF8F] rounded-2xl p-[1px] shadow-2xl shadow-emerald-900/40">
        <div className="bg-slate-950/95 backdrop-blur-xl rounded-2xl p-4 flex items-start gap-3">
          {/* Icon */}
          <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-[#1B6B4A] to-[#38BF8F] flex items-center justify-center shadow-lg shadow-emerald-800/30">
            <Smartphone className="w-6 h-6 text-white" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h4 className="text-[15px] font-bold text-white leading-tight">
              Install CredLink
            </h4>
            <p className="text-[13px] text-slate-400 mt-0.5 leading-snug">
              {isIOS
                ? 'Add to your home screen for the best experience.'
                : 'Install on your device for instant access.'}
            </p>

            {isIOS ? (
              <div className="mt-2.5 flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700/50">
                <Share2 className="w-4 h-4 text-blue-400 shrink-0" />
                <span className="text-[12px] text-slate-300 leading-snug">
                  Tap <strong className="text-white">Share</strong> then <strong className="text-white">"Add to Home Screen"</strong>
                </span>
              </div>
            ) : (
              <button
                onClick={handleInstallClick}
                className="mt-2.5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#1B6B4A] to-[#2D9D6A] hover:from-[#22805A] hover:to-[#38BF8F] text-white text-[13px] font-bold transition-all duration-200 shadow-md shadow-emerald-900/30 active:scale-[0.96]"
              >
                <Download className="w-4 h-4" />
                Install App
              </button>
            )}
          </div>

          {/* Close */}
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800/60 transition-colors active:bg-slate-700/60"
            aria-label="Dismiss install prompt"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Inline install button for embedding in navbar mobile menu.
 * ONLY renders on mobile devices.
 */
export function PWAInstallInlineButton({ className = '' }: { className?: string }) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const isMobile = useIsMobile();
  const isIOS = useIsIOS();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
      || (window.navigator as any).standalone === true;
    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
    } catch (err) {
      console.warn('Install prompt error:', err);
    }
    setDeferredPrompt(null);
  };

  // MOBILE ONLY: hide on desktop
  if (!isMobile) return null;
  if (isInstalled) return null;

  // On iOS show guidance text, on Android show install button
  if (isIOS) {
    return (
      <div className={`flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 ${className}`}>
        <Share2 className="w-4 h-4 text-blue-500 shrink-0" />
        <span className="text-[13px] text-slate-600 dark:text-slate-300">
          Tap <strong>Share</strong> → <strong>"Add to Home Screen"</strong>
        </span>
      </div>
    );
  }

  if (!deferredPrompt) return null;

  return (
    <button
      onClick={handleInstallClick}
      className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-[#1B6B4A] to-[#2D9D6A] text-white text-sm font-bold transition-all duration-200 shadow-md shadow-emerald-900/20 active:scale-[0.97] ${className}`}
    >
      <Download className="w-4 h-4" />
      Install CredLink App
    </button>
  );
}

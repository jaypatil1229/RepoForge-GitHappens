'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Check, CircleAlert, Info, X } from 'lucide-react';
import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';

import { cn } from '@/lib/utils';

export type ToastTone = 'success' | 'error' | 'info';

interface ToastItem {
  id: number;
  tone: ToastTone;
  title: string;
  description?: string;
}

interface ToastApi {
  push: (toast: Omit<ToastItem, 'id'>) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

const toneStyles: Record<ToastTone, string> = {
  success: 'border-success-700/25 bg-success-50 text-success-700',
  error: 'border-danger-700/25 bg-danger-50 text-danger-700',
  info: 'border-line-300 bg-paper-0 text-ink-800',
};

const toneIcons: Record<ToastTone, typeof Check> = {
  success: Check,
  error: CircleAlert,
  info: Info,
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const counter = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const push = useCallback(
    (toast: Omit<ToastItem, 'id'>) => {
      counter.current += 1;
      const id = counter.current;
      setToasts((current) => [...current.slice(-2), { ...toast, id }]);
      window.setTimeout(() => dismiss(id), toast.tone === 'error' ? 8000 : 5000);
    },
    [dismiss],
  );

  const api = useMemo(() => ({ push }), [push]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="pointer-events-none fixed inset-x-0 bottom-0 z-[70] flex flex-col items-center gap-2 p-4 sm:items-end sm:p-6"
      >
        <AnimatePresence initial={false}>
          {toasts.map((toast) => {
            const Icon = toneIcons[toast.tone];
            return (
              <motion.div
                key={toast.id}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                className={cn(
                  'pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-panel border p-3.5 shadow-raised',
                  toneStyles[toast.tone],
                )}
              >
                <Icon aria-hidden className="mt-0.5 size-4 shrink-0" strokeWidth={2} />
                <div className="min-w-0 flex-1">
                  <p className="text-ui font-semibold">{toast.title}</p>
                  {toast.description ? <p className="mt-0.5 text-micro text-ink-600">{toast.description}</p> : null}
                </div>
                <button
                  type="button"
                  onClick={() => dismiss(toast.id)}
                  className="-m-1 rounded p-1 text-ink-500 transition-colors hover:text-ink-950"
                  aria-label="Dismiss notification"
                >
                  <X aria-hidden className="size-3.5" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used inside ToastProvider');
  return context;
}
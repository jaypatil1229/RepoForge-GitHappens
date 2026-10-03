import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface ToastProps {
  id: string;
  type?: 'success' | 'error' | 'info';
  title: string;
  message?: string;
  onClose: (id: string) => void;
  duration?: number;
}

export function Toast({ id, type = 'info', title, message, onClose, duration = 4000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(id);
    }, duration);
    return () => clearTimeout(timer);
  }, [id, duration, onClose]);

  const icons = {
    success: <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />,
    error: <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />,
    info: <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
  };

  const borders = {
    success: 'border-emerald-200 dark:border-emerald-900/60',
    error: 'border-rose-200 dark:border-rose-900/60',
    info: 'border-blue-200 dark:border-blue-900/60'
  };

  return (
    <div
      className={cn(
        'flex items-start gap-3 p-3.5 bg-white dark:bg-slate-900 border rounded-lg shadow-lg text-xs w-80 animate-fade-in transition-all',
        borders[type]
      )}
    >
      {icons[type]}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-slate-900 dark:text-slate-100">{title}</p>
        {message && <p className="text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">{message}</p>}
      </div>
      <button onClick={() => onClose(id)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

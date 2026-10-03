import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from './Button';

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
}

export function Drawer({ isOpen, onClose, title, description, children }: DrawerProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 dark:bg-slate-950/70 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-md h-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
            {description && <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{description}</p>}
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-7 w-7 p-0 rounded-full">
            <X className="w-4 h-4" />
          </Button>
        </div>
        <div className="p-5 flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

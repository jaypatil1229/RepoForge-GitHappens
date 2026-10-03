'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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

  if (!isOpen || !mounted) return null;

  const drawerContent = (
    <div
      className="fixed inset-0 z-[100] flex justify-end bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm"
      style={{ minHeight: '100dvh', minWidth: '100vw' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-md h-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col pb-6 md:pb-0"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
          <div className="pr-3 min-w-0">
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 truncate">{title}</h3>
            {description && (
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">{description}</p>
            )}
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0 rounded-full shrink-0 hover:bg-slate-100 dark:hover:bg-slate-800">
            <X className="w-4 h-4" />
          </Button>
        </div>
        <div className="p-4 sm:p-5 flex-1 overflow-y-auto overscroll-contain touch-pan-y">{children}</div>
      </div>
    </div>
  );

  return createPortal(drawerContent, document.body);
}

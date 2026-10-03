import React from 'react';
import { cn } from '../../lib/utils';

export interface TabItem {
  id: string;
  label: string;
  count?: number;
  icon?: React.ReactNode;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
}

export function Tabs({ tabs, activeTab, onChange, className }: TabsProps) {
  return (
    <div className={cn('flex items-center gap-1 border-b border-slate-200 dark:border-slate-800', className)}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={cn(
              'px-3.5 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors flex items-center gap-2 focus:outline-none',
              isActive
                ? 'border-slate-900 text-slate-900 dark:border-slate-100 dark:text-slate-100 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            )}
          >
            {tab.icon}
            <span>{tab.label}</span>
            {typeof tab.count === 'number' && (
              <span
                className={cn(
                  'px-2 py-0.5 text-xs rounded-full font-semibold',
                  isActive
                    ? 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100'
                    : 'bg-slate-100 text-slate-500 dark:bg-slate-800/80 dark:text-slate-400'
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

'use client';

import { ArrowRight, Loader2, ShieldAlert } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { navForRole, navLabel, roleLabel } from '@/components/portal/nav';
import { useDemo } from '@/lib/demo/demo-provider';
import { demoAccounts } from '@/lib/mock/fixtures';
import type { AccountRole } from '@/lib/types';
import { cn, initials } from '@/lib/utils';

const groups = [
  {
    key: 'citizen',
    title: 'Citizen',
    summary: 'Hold records and decide what to share.',
    accounts: ['citizen', 'suspended'],
    span: 'lg:col-span-4',
  },
  {
    key: 'institution',
    title: 'Institution',
    summary: 'Issue records and verify requests inside a domain.',
    accounts: ['college', 'employer', 'hospital', 'bank', 'issuer-suspended-trust'],
    span: 'lg:col-span-5',
  },
  {
    key: 'admin',
    title: 'Administrator',
    summary: 'Approve organizations and govern the trust registry.',
    accounts: ['admin'],
    span: 'lg:col-span-3',
  },
] as const;

function previewNav(role: AccountRole) {
  return navForRole(role).map((item) => ({
    href: item.href,
    label: navLabel(item, role),
    description: item.description,
  }));
}

export function DemoPicker() {
  const router = useRouter();
  const { enter } = useDemo();
  const [pending, setPending] = useState<string | null>(null);

  function open(key: string) {
    const account = demoAccounts.find((item) => item.key === key);
    if (!account) return;
    setPending(key);
    enter(account);
    router.push('/portal');
  }

  return (
    <div className="grid gap-x-10 gap-y-12 lg:grid-cols-12">
      {groups.map((group) => {
        const accounts = group.accounts
          .map((key) => demoAccounts.find((account) => account.key === key))
          .filter((account): account is (typeof demoAccounts)[number] => Boolean(account));
        const representative = accounts[0];
        const screens = representative ? previewNav(representative.role) : [];

        return (
          <section key={group.key} className={cn('border-t border-line-300 pt-6', group.span)}>
            <h2 className="type-display text-h3 text-ink-950">{group.title}</h2>
            <p className="mt-2 max-w-measure text-ui text-pretty text-ink-600">{group.summary}</p>

            <ul className="mt-6 flex flex-col gap-2">
              {accounts.map((account) => (
                <li key={account.key}>
                  <button
                    type="button"
                    onClick={() => open(account.key)}
                    disabled={pending !== null}
                    className={cn(
                      'group flex w-full items-center gap-3 rounded-panel border px-3.5 py-3 text-left transition-colors duration-150 disabled:opacity-60',
                      account.accountStatus === 'SUSPENDED'
                        ? 'border-warning-700/25 bg-warning-50 hover:border-warning-700/50'
                        : 'border-line-200 bg-paper-0 hover:border-forest-800/30 hover:bg-forest-50',
                    )}
                  >
                    <span
                      aria-hidden
                      className={cn(
                        'grid size-8 shrink-0 place-items-center rounded-full text-micro font-semibold',
                        account.accountStatus === 'SUSPENDED'
                          ? 'bg-warning-100 text-warning-700'
                          : 'bg-forest-800 text-paper-0',
                      )}
                    >
                      {account.accountStatus === 'SUSPENDED' ? (
                        <ShieldAlert className="size-3.5" />
                      ) : (
                        initials(account.fullName)
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-baseline gap-x-2">
                        <span className="text-ui font-medium text-ink-950">{account.fullName}</span>
                        <span className="text-micro text-ink-500">{roleLabel[account.role]}</span>
                      </span>
                      <span className="mt-0.5 block text-micro leading-relaxed text-ink-600">
                        {account.headline}
                      </span>
                    </span>
                    {pending === account.key ? (
                      <Loader2 aria-hidden className="size-4 shrink-0 animate-spin text-ink-500" />
                    ) : (
                      <ArrowRight
                        aria-hidden
                        className="size-4 shrink-0 text-ink-500 transition-transform duration-150 group-hover:translate-x-0.5"
                      />
                    )}
                  </button>
                </li>
              ))}
            </ul>

            {screens.length > 0 ? (
              <div className="mt-6">
                <p className="text-micro text-ink-500">Screens in this context</p>
                <ul className="mt-3 flex flex-wrap gap-1.5">
                  {screens.map((screen) => (
                    <li
                      key={screen.href}
                      className="rounded-full border border-line-200 bg-paper-50 px-2.5 py-1 text-micro text-ink-600"
                    >
                      {screen.label}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </section>
        );
      })}
    </div>
  );
}
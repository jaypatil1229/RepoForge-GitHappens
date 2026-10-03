import type { ComponentProps, ReactNode } from 'react'
import { BadgeCheck, ChevronLeft, History, User, Wallet } from 'lucide-react'
import { cn } from '@/lib/utils'

const markSizes = {
  sm: 'size-8 rounded-lg text-xs',
  md: 'size-10 rounded-xl text-sm',
  lg: 'size-16 rounded-2xl text-xl',
  xl: 'size-20 rounded-3xl text-2xl',
}

export function CredLinkMark({ size = 'sm', className }: { size?: keyof typeof markSizes; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'inline-flex shrink-0 items-center justify-center bg-primary font-bold tracking-tight text-primary-foreground',
        markSizes[size],
        className,
      )}
    >
      CL
    </span>
  )
}

export function BrandLockup({ subtitle, className }: { subtitle?: string; className?: string }) {
  return (
    <div className={cn('flex min-w-0 items-center gap-2.5', className)}>
      <CredLinkMark size="sm" />
      <div className="min-w-0 leading-tight">
        <p className="truncate text-base font-semibold tracking-tight text-ink">CredLink Wallet</p>
        {subtitle && <p className="truncate text-[11px] text-muted-foreground">{subtitle}</p>}
      </div>
    </div>
  )
}

const iconButton =
  'inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-border text-foreground transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none'

export function AppHeader({ subtitle = 'CredLink Network', action }: { subtitle?: string; action?: ReactNode }) {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-3 border-b border-border px-5">
      <BrandLockup subtitle={subtitle} />
      {action}
    </header>
  )
}

export function IconButton({ className, ...props }: ComponentProps<'button'>) {
  return <button type="button" className={cn(iconButton, className)} {...props} />
}

export function ScreenHeader({
  title,
  onBack,
  action,
}: {
  title?: string
  onBack?: () => void
  action?: ReactNode
}) {
  return (
    <header className="flex h-16 shrink-0 items-center gap-3 border-b border-border px-5">
      {onBack && (
        <IconButton onClick={onBack}>
          <ChevronLeft className="size-5" />
          <span className="sr-only">Back</span>
        </IconButton>
      )}
      <BrandLockup subtitle={title ?? 'CredLink Network'} className="flex-1" />
      {action}
    </header>
  )
}

export function VerifiedBadge({ children = 'Verified', className }: { children?: ReactNode; className?: string }) {
  return (
    <StatusBadge tone="success" className={className}>
      <BadgeCheck className="size-3.5" />
      {children}
    </StatusBadge>
  )
}

export function ScreenBody({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('min-h-0 flex-1 overflow-y-auto px-5 pb-6 [&>*]:shrink-0', className)} {...props} />
}

export function ScreenFooter({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      className={cn('flex shrink-0 flex-col gap-2.5 border-t border-border bg-background px-5 py-4', className)}
      {...props}
    />
  )
}

export function PrimaryButton({ className, ...props }: ComponentProps<'button'>) {
  return (
    <button
      type="button"
      className={cn(
        'inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-ink focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:opacity-60',
        className,
      )}
      {...props}
    />
  )
}

export function SecondaryButton({ className, ...props }: ComponentProps<'button'>) {
  return (
    <button
      type="button"
      className={cn(
        'inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-border bg-background px-5 text-sm font-semibold text-foreground transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none',
        className,
      )}
      {...props}
    />
  )
}

export function Card({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      className={cn('rounded-2xl border border-border bg-card p-4 text-card-foreground shadow-[0_1px_2px_rgba(17,17,17,0.04)]', className)}
      {...props}
    />
  )
}

export function StatusBadge({
  tone = 'success',
  children,
  className,
}: {
  tone?: 'success' | 'warning' | 'muted' | 'danger'
  children: ReactNode
  className?: string
}) {
  const tones = {
    success: 'bg-success text-white',
    warning: 'bg-warning-soft text-warning',
    muted: 'bg-muted text-muted-foreground',
    danger: 'bg-destructive-soft text-destructive',
  }
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}

export function InstitutionAvatar({
  label,
  icon,
  className,
}: {
  label?: string
  icon?: ReactNode
  className?: string
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'inline-flex size-11 shrink-0 items-center justify-center rounded-full border border-border bg-muted text-xs font-bold tracking-wide text-primary',
        className,
      )}
    >
      {icon ?? label}
    </span>
  )
}

export function SectionTitle({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <h2 className={cn('mb-3 text-xs font-semibold tracking-wider text-muted-foreground uppercase', className)}>
      {children}
    </h2>
  )
}

export function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <dt className="shrink-0 text-sm text-muted-foreground">{label}</dt>
      <dd className="text-right text-sm font-medium text-pretty text-foreground">{value}</dd>
    </div>
  )
}

export type Tab = 'home' | 'activity' | 'profile'

const tabs: { id: Tab; label: string; icon: typeof Wallet }[] = [
  { id: 'home', label: 'Wallet', icon: Wallet },
  { id: 'activity', label: 'Activity', icon: History },
  { id: 'profile', label: 'Profile', icon: User },
]

export function BottomNav({ active, onNavigate }: { active: Tab; onNavigate: (tab: Tab) => void }) {
  return (
    <nav aria-label="Primary" className="shrink-0 border-t border-border bg-background px-4 pt-2 pb-3">
      <ul className="grid grid-cols-3">
        {tabs.map(({ id, label, icon: Icon }) => {
          const isActive = id === active
          return (
            <li key={id}>
              <button
                type="button"
                onClick={() => onNavigate(id)}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'flex w-full flex-col items-center gap-1 rounded-xl py-1.5 text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
                  isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <span
                  className={cn(
                    'inline-flex h-7 w-12 items-center justify-center rounded-full transition-colors',
                    isActive && 'bg-success-soft',
                  )}
                >
                  <Icon className="size-5" strokeWidth={isActive ? 2.25 : 1.75} />
                </span>
                {label}
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

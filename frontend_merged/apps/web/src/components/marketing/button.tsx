import Link from 'next/link';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';

import { cn } from '@/lib/utils';

type Variant = 'primary' | 'secondary' | 'tertiary' | 'danger' | 'inverse';
type Size = 'sm' | 'md' | 'lg' | 'icon';

const base =
  'inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-control font-medium transition-[background-color,border-color,color,box-shadow] duration-150 ease-settle disabled:pointer-events-none disabled:opacity-45';

const variants: Record<Variant, string> = {
  primary: 'bg-forest-800 text-white hover:bg-forest-700 active:bg-forest-900',
  secondary: 'border border-line-300 bg-paper-0 text-ink-950 hover:border-ink-500 hover:bg-paper-50',
  tertiary: 'text-ink-800 hover:bg-forest-50 hover:text-forest-800',
  danger: 'bg-danger-700 text-white hover:bg-[#9d1e2b]',
  inverse: 'bg-paper-0 text-ink-950 hover:bg-paper-100',
};

const sizes: Record<Size, string> = {
  sm: 'h-8 px-3 text-ui',
  md: 'h-10 px-4 text-ui',
  lg: 'h-11 px-5 text-body',
  icon: 'size-9',
};

export function buttonStyles({
  variant = 'primary',
  size = 'md',
  className,
}: { variant?: Variant; size?: Size; className?: string } = {}) {
  return cn(base, variants[variant], sizes[size], className);
}

interface ButtonProps extends ComponentPropsWithoutRef<'button'> {
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
}

export function Button({ variant, size, className, icon, children, ...props }: ButtonProps) {
  return (
    <button type="button" className={buttonStyles({ variant, size, className })} {...props}>
      {icon}
      {children}
    </button>
  );
}

interface ButtonLinkProps extends ComponentPropsWithoutRef<typeof Link> {
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
}

export function ButtonLink({ variant, size, className, icon, children, ...props }: ButtonLinkProps) {
  return (
    <Link className={buttonStyles({ variant, size, className })} {...props}>
      {icon}
      {children}
    </Link>
  );
}

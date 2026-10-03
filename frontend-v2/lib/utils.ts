import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

/**
 * tailwind-merge cannot infer our custom type-scale keys, so it treats `text-body`,
 * `text-ui` and friends as text colours and drops a real colour that precedes them.
 * Teaching it the scale keeps colour and size independent in every `cn()` call.
 */
const mergeClassNames = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [
        {
          text: [
            'micro',
            'ui',
            'body',
            'body-lg',
            'h4',
            'h3',
            'h2',
            'h1',
            'display-l',
            'display-xl',
          ],
        },
      ],
    },
  },
});

/** Merge conditional class names and resolve Tailwind conflicts deterministically. */
export function cn(...inputs: ClassValue[]) {
  return mergeClassNames(clsx(inputs));
}

/** Resolve after a delay. Used only by the mock data layer to expose loading states. */
export function sleep(ms: number, signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('Aborted', 'AbortError'));
      return;
    }
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener(
      'abort',
      () => {
        clearTimeout(timer);
        reject(new DOMException('Aborted', 'AbortError'));
      },
      { once: true },
    );
  });
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : '';
  return (first + last).toUpperCase();
}

/** "3 credentials" / "1 credential" without importing a pluralisation dependency. */
export function pluralize(count: number, singular: string, plural = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

export function percent(part: number, total: number): string {
  if (total <= 0) return '0%';
  return `${Math.round((part / total) * 100)}%`;
}

export function unique<T>(values: T[]): T[] {
  return Array.from(new Set(values));
}
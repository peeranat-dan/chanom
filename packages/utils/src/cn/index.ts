import type { ClassValue } from 'clsx';

import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export type { ClassValue } from 'clsx';

/**
 * Join conditional class names and resolve conflicting Tailwind classes so the
 * last one wins: `cn('px-2', isActive && 'px-4')` returns `'px-4'` when active.
 */
export default function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

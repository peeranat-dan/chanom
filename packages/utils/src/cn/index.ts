import type { ClassValue } from 'cn';

import { cn as mergeClasses } from 'cn';

export type { ClassValue } from 'cn';

/**
 * Join conditional class names and resolve conflicting Tailwind classes so the
 * last one wins: `cn('px-2', isActive && 'px-4')` returns `'px-4'` when active.
 */
export default function cn(...inputs: ClassValue[]): string {
  return mergeClasses(...inputs);
}

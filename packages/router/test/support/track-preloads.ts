import type { Mock } from 'vitest';

import { vi } from 'vitest';

import { registerRoutes } from '../../src/core/preload-registry.ts';

/** Registers an `/about` route whose lazy loader is the returned spy, so tests can observe preloads. */
export function trackPreloads(): Mock<() => Promise<object>> {
  const lazy = vi.fn(async () => ({}));
  registerRoutes([{ path: '/about', lazy }]);
  return lazy;
}

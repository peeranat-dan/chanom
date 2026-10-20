import type { Mock } from 'vitest';

import { vi } from 'vitest';

import registerRoutes from '../../src/react-router/utils/register-routes.ts';

/** Registers an `/about` route whose lazy loader is the returned spy, so tests can observe preloads. */
export function trackPreloads(): Mock<() => Promise<object>> {
  const lazy = vi.fn(async () => ({}));
  registerRoutes([{ path: '/about', lazy }]);
  return lazy;
}

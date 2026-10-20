// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';

import createRouter from '../../src/react-router/create-router.ts';

describe('createRouter', () => {
  it('creates a browser router over the page routes', () => {
    const router = createRouter(
      { './pages/index.tsx': { default: () => null } },
      { basename: '/app' },
    );

    expect(router.basename).toBe('/app');
    expect(router.routes[0]?.path).toBe('/');
    expect(router.routes[0]?.children?.[0]?.index).toBe(true);
    router.dispose();
  });
});

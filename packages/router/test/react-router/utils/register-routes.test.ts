import { describe, expect, it } from 'vitest';

import registerRoutes from '../../../src/react-router/utils/register-routes.ts';
import registeredRoutes from '../../../src/react-router/utils/registered-routes.ts';

describe('registerRoutes', () => {
  it('replaces the registered route tree', () => {
    const routes = [{ path: '/' }];

    registerRoutes(routes);

    expect(registeredRoutes.current).toBe(routes);
  });
});

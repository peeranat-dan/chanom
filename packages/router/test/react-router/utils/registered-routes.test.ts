import { describe, expect, it } from 'vitest';

import registeredRoutes from '../../../src/react-router/utils/registered-routes.ts';

describe('registeredRoutes', () => {
  it('holds a route tree', () => {
    expect(Array.isArray(registeredRoutes.current)).toBe(true);
  });
});

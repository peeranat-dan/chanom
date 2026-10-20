import { describe, expect, it } from 'vitest';

import { toRouteProps } from '../../src/core/route-props.ts';

describe('toRouteProps', () => {
  it('maps module exports to route properties', () => {
    const Page = (): null => null;
    const ErrorBoundary = (): null => null;
    const loader = (): null => null;
    const action = (): null => null;
    const shouldRevalidate = (): boolean => false;

    expect(
      toRouteProps({
        default: Page,
        loader,
        action,
        ErrorBoundary,
        handle: { crumb: 'Home' },
        shouldRevalidate,
      }),
    ).toEqual({
      Component: Page,
      loader,
      action,
      ErrorBoundary,
      handle: { crumb: 'Home' },
      shouldRevalidate,
    });
  });

  it('leaves out missing exports instead of setting them to undefined', () => {
    expect(Object.keys(toRouteProps({ handle: 0 }))).toEqual(['handle']);
  });
});

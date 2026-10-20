import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';

import assignRef from '../../../src/react-router/utils/assign-ref.ts';

describe('assignRef', () => {
  it('sets object refs and clears them on cleanup', () => {
    const ref = createRef<string>();

    const cleanup = assignRef(ref, 'node');
    expect(ref.current).toBe('node');
    cleanup?.();
    expect(ref.current).toBeNull();
  });

  it('calls callback refs with the node, then null on cleanup', () => {
    const ref = vi.fn();

    assignRef(ref, 'node')?.();

    expect(ref.mock.calls).toEqual([['node'], [null]]);
  });

  it('returns the cleanup a callback ref provides', () => {
    const inner = vi.fn();

    expect(assignRef(() => inner, 'node')).toBe(inner);
  });

  it('does nothing without a ref', () => {
    expect(assignRef(undefined, 'node')).toBeUndefined();
  });
});

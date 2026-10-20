import { describe, expect, it, vi } from 'vitest';

import getWebStorage from '../../../src/storage/utils/get-web-storage.ts';
import { stubStorage } from '../../support/storage.ts';

describe('getWebStorage', () => {
  it('returns the requested storage area', () => {
    const local = stubStorage('localStorage');
    const session = stubStorage('sessionStorage');

    expect(getWebStorage('local')).toBe(local);
    expect(getWebStorage('session')).toBe(session);
  });

  it('returns undefined when storage is missing', () => {
    vi.stubGlobal('localStorage', undefined);

    expect(getWebStorage('local')).toBeUndefined();
  });

  it('returns undefined when accessing storage throws', () => {
    // Stub first so `unstubGlobals` restores the original descriptor afterwards.
    vi.stubGlobal('localStorage', undefined);
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      get: () => {
        throw new DOMException('blocked', 'SecurityError');
      },
    });

    expect(getWebStorage('local')).toBeUndefined();
  });
});

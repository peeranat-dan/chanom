import { describe, expect, it, vi } from 'vitest';

import storage from '../../src/storage/index.ts';
import { stubStorage } from '../support/storage.ts';

describe('storage', () => {
  it('round-trips JSON values', () => {
    const local = stubStorage('localStorage');
    const settings = storage<{ readonly theme: string }>('settings');

    expect(settings.set({ theme: 'dark' })).toBe(true);
    expect(local.getItem('settings')).toBe('{"theme":"dark"}');
    expect(settings.get()).toEqual({ theme: 'dark' });
  });

  it('uses sessionStorage for the session area', () => {
    const local = stubStorage('localStorage');
    const session = stubStorage('sessionStorage');

    storage<number>('count', { area: 'session' }).set(1);

    expect(session.getItem('count')).toBe('1');
    expect(local.getItem('count')).toBeNull();
  });

  it('returns undefined for a missing key', () => {
    stubStorage('localStorage');

    expect(storage('missing').get()).toBeUndefined();
  });

  it('returns undefined for corrupt JSON', () => {
    stubStorage('localStorage').setItem('broken', '{');

    expect(storage('broken').get()).toBeUndefined();
  });

  it('returns undefined when validate rejects the stored value', () => {
    stubStorage('localStorage').setItem('theme', '"purple"');
    const isTheme = (value: unknown): value is 'light' | 'dark' =>
      value === 'light' || value === 'dark';

    expect(storage('theme', { validate: isTheme }).get()).toBeUndefined();
    storage('theme', { validate: isTheme }).set('dark');
    expect(storage('theme', { validate: isTheme }).get()).toBe('dark');
  });

  it('returns false when setItem throws, e.g. over quota', () => {
    const local = stubStorage('localStorage');
    vi.spyOn(local, 'setItem').mockImplementation(() => {
      throw new DOMException('full', 'QuotaExceededError');
    });

    expect(storage('big').set('value')).toBe(false);
  });

  it('removes the key', () => {
    const local = stubStorage('localStorage');
    local.setItem('token', '"abc"');

    storage('token').remove();

    expect(local.getItem('token')).toBeNull();
  });

  it('degrades quietly when storage is unavailable (SSR)', () => {
    vi.stubGlobal('localStorage', undefined);
    const item = storage<string>('key');

    expect(item.get()).toBeUndefined();
    expect(item.set('value')).toBe(false);
    expect(() => {
      item.remove();
    }).not.toThrow();
  });
});

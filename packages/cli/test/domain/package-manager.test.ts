import { describe, expect, it } from '@effect/vitest';

import { parsePmField, parsePmUserAgent, resolvePm } from '../../src/domain/package-manager.ts';

describe('parsePmField', () => {
  it('parses a known package manager from the packageManager field', () => {
    expect(parsePmField('pnpm@11.9.0')).toBe('pnpm');
    expect(parsePmField('yarn@4.5.0')).toBe('yarn');
  });

  it('returns undefined for unknown or missing values', () => {
    expect(parsePmField('deno@2.0.0')).toBeUndefined();
    expect(parsePmField('')).toBeUndefined();
    expect(parsePmField(undefined)).toBeUndefined();
  });
});

describe('parsePmUserAgent', () => {
  it('matches the leading package manager name', () => {
    expect(parsePmUserAgent('pnpm/11.9.0 npm/? node/v22.0.0')).toBe('pnpm');
    expect(parsePmUserAgent('bun/1.1.0 npm/? node/v22.0.0')).toBe('bun');
  });

  it('returns undefined for unknown or missing agents', () => {
    expect(parsePmUserAgent('cargo/1.0.0')).toBeUndefined();
    expect(parsePmUserAgent(undefined)).toBeUndefined();
  });
});

describe('resolvePm', () => {
  it('prefers the packageManager field over the user agent', () => {
    expect(
      resolvePm({ packageManagerField: 'yarn@4.5.0', userAgent: 'pnpm/11.9.0 node/v22' }),
    ).toBe('yarn');
  });

  it('falls back to the user agent, then the fallback', () => {
    expect(
      resolvePm({
        userAgent: 'npm/10.0.0 node/v22',
        fallback: undefined,
        packageManagerField: undefined,
      }),
    ).toBe('npm');
    expect(
      resolvePm({ fallback: 'bun', userAgent: undefined, packageManagerField: undefined }),
    ).toBe('bun');
    expect(
      resolvePm({ fallback: 'pnpm', userAgent: undefined, packageManagerField: undefined }),
    ).toBe('pnpm');
  });

  it('defaults to pnpm when no hint resolves', () => {
    expect(resolvePm({ packageManagerField: undefined, userAgent: undefined })).toBe('pnpm');
  });

  it('ignores an unparseable field and keeps resolving', () => {
    expect(resolvePm({ packageManagerField: 'deno@2.0.0', userAgent: 'yarn/4.5.0 node/v22' })).toBe(
      'yarn',
    );
  });
});

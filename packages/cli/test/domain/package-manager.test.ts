import { describe, expect, it } from '@effect/vitest';

import type { WorkspaceHints } from '../../src/domain/package-manager.ts';

import {
  parsePmField,
  parsePmUserAgent,
  resolvePm,
  workspaceRootFlags,
} from '../../src/domain/package-manager.ts';

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

describe('workspaceRootFlags', () => {
  const hints = (overrides: Partial<WorkspaceHints> = {}): WorkspaceHints => ({
    hasPnpmWorkspaceFile: false,
    hasWorkspacesField: false,
    hasYarnBerryConfig: false,
    ...overrides,
  });

  it('adds -w for pnpm only when a pnpm-workspace.yaml is present', () => {
    expect(workspaceRootFlags('pnpm', hints({ hasPnpmWorkspaceFile: true }))).toEqual(['-w']);
    expect(workspaceRootFlags('pnpm', hints())).toEqual([]);
    expect(workspaceRootFlags('pnpm', hints({ hasWorkspacesField: true }))).toEqual([]);
  });

  it('adds -W for yarn classic only when a workspaces field is present', () => {
    expect(workspaceRootFlags('yarn', hints({ hasWorkspacesField: true }))).toEqual(['-W']);
    expect(workspaceRootFlags('yarn', hints())).toEqual([]);
  });

  it('adds no flag for yarn berry even at a workspace root', () => {
    expect(
      workspaceRootFlags('yarn', hints({ hasWorkspacesField: true, hasYarnBerryConfig: true })),
    ).toEqual([]);
  });

  it('adds no flag for npm and bun, which install to the root as-is', () => {
    expect(workspaceRootFlags('npm', hints({ hasWorkspacesField: true }))).toEqual([]);
    expect(workspaceRootFlags('bun', hints({ hasWorkspacesField: true }))).toEqual([]);
  });
});

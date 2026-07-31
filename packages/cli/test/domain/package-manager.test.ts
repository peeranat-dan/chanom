import { describe, expect, it } from '@effect/vitest';

import type { WorkspaceHints } from '../../src/domain/package-manager.ts';

import { workspaceRootFlags } from '../../src/domain/package-manager.ts';

// The pm resolvers (parsePmField/parsePmUserAgent/resolvePm) moved to
// @chanom/internal and are tested there; only the workspace-root flags remain
// cli-specific.
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

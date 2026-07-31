import { describe, expect, it } from 'vitest';

import { buildPnpmWorkspace } from '../../src/generate/pnpm-workspace.ts';

describe('buildPnpmWorkspace', () => {
  it('renders the pnpm build allow-list byte-for-byte', () => {
    expect(buildPnpmWorkspace()).toBe(`onlyBuiltDependencies:
  - esbuild
allowBuilds:
  esbuild: true
`);
  });

  it('allows esbuild to run its build script', () => {
    expect(buildPnpmWorkspace()).toContain('esbuild: true');
  });
});

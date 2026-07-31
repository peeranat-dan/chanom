import { describe, expect, it } from 'vitest';

import { catalogVersion, catalogVersionStrict } from '../../src/catalog/version.ts';

// These read the repo's real pnpm-workspace.yaml, the single source of truth
// both bundles inject from. `oxlint` is a stable, long-lived catalog entry.
describe('catalogVersion', () => {
  it('returns the pinned version for a catalogued tool', () => {
    expect(catalogVersion('oxlint')).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it('reads quoted, scoped catalog keys', () => {
    expect(catalogVersion('@vitest/coverage-v8')).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it('does not read keys outside the catalog block', () => {
    // `esbuild` lives under allowBuilds, not catalog.
    expect(catalogVersion('esbuild')).toBe('latest');
  });

  it('falls back to "latest" for an absent key', () => {
    expect(catalogVersion('definitely-not-a-catalogued-tool')).toBe('latest');
  });
});

describe('catalogVersionStrict', () => {
  it('returns the pinned version for a catalogued tool', () => {
    expect(catalogVersionStrict('oxlint')).toBe(catalogVersion('oxlint'));
  });

  it('throws for an absent key instead of shipping "latest"', () => {
    expect(() => catalogVersionStrict('definitely-not-a-catalogued-tool')).toThrow(
      /No catalog version/,
    );
  });
});

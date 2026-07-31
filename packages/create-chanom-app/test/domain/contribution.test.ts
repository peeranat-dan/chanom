import { describe, expect, it } from 'vitest';

import type { Contribution } from '../../src/domain/contribution.ts';

import { emptyContribution, mergeContributions } from '../../src/domain/contribution.ts';

const make = (overrides: Partial<Contribution>): Contribution => ({
  ...emptyContribution,
  ...overrides,
});

describe('mergeContributions', () => {
  it('returns an empty contribution for no inputs', () => {
    expect(mergeContributions([])).toEqual(emptyContribution);
  });

  it('de-duplicates package names, vite imports, and plugins by first position', () => {
    const a = make({
      dependencies: ['react', 'react-dom'],
      viteImports: ["import react from '@vitejs/plugin-react';"],
      vitePlugins: ['react()'],
    });
    const b = make({
      dependencies: ['react'],
      viteImports: ["import react from '@vitejs/plugin-react';"],
      vitePlugins: ['react()'],
    });
    const merged = mergeContributions([a, b]);
    expect(merged.dependencies).toEqual(['react', 'react-dom']);
    expect(merged.viteImports).toEqual(["import react from '@vitejs/plugin-react';"]);
    expect(merged.vitePlugins).toEqual(['react()']);
  });

  it('merges scripts with later contributions overriding earlier keys', () => {
    const a = make({ scripts: { dev: 'vite', build: 'old' } });
    const b = make({ scripts: { build: 'new', prepare: 'husky' } });
    expect(mergeContributions([a, b]).scripts).toEqual({
      dev: 'vite',
      build: 'new',
      prepare: 'husky',
    });
  });

  it('keeps the first writer for files that share a path', () => {
    const a = make({ files: [{ path: '.gitignore', contents: 'first\n' }] });
    const b = make({ files: [{ path: '.gitignore', contents: 'second\n' }] });
    expect(mergeContributions([a, b]).files).toEqual([{ path: '.gitignore', contents: 'first\n' }]);
  });
});

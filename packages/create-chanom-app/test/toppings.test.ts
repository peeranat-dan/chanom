import { describe, expect, it } from 'vitest';

import { baseline, commitHooks, selectContributions } from '../src/toppings.ts';

describe('baseline', () => {
  it('puts only react + react-dom in runtime dependencies (no chanom footprint)', () => {
    expect(baseline.dependencies).toEqual(['react', 'react-dom']);
  });

  it('wires the chanom configs as dev dependencies', () => {
    expect(baseline.devDependencies).toContain('@chanom/dev-config');
    expect(baseline.devDependencies).toContain('@chanom/vite-config');
  });

  it('contributes the react vite plugin and no verbatim files of its own', () => {
    expect(baseline.viteImports).toEqual(["import react from '@vitejs/plugin-react';"]);
    expect(baseline.vitePlugins).toEqual(['react()']);
    expect(baseline.files).toEqual([]);
  });
});

describe('commitHooks', () => {
  it('adds only the four hook dev dependencies and a prepare script', () => {
    const contribution = commitHooks('pnpm');
    expect(contribution.dependencies).toEqual([]);
    expect(contribution.devDependencies).toEqual([
      'husky',
      'lint-staged',
      '@commitlint/cli',
      '@commitlint/config-conventional',
    ]);
    expect(contribution.scripts).toEqual({ prepare: 'husky' });
  });

  it('writes the four hook/config files with the PM-specific commit-msg hook', () => {
    const paths = commitHooks('pnpm').files.map((file) => file.path);
    expect(paths).toEqual([
      '.husky/pre-commit',
      '.husky/commit-msg',
      '.lintstagedrc.json',
      '.commitlintrc.json',
    ]);
    const commitMsg = commitHooks('yarn').files.find((f) => f.path === '.husky/commit-msg');
    expect(commitMsg?.contents).toBe('yarn commitlint --edit $1\n');
  });
});

describe('selectContributions', () => {
  it('is baseline-only when commit hooks are off', () => {
    expect(selectContributions({ pm: 'pnpm', commitHooks: false })).toEqual([baseline]);
  });

  it('appends the commit-hooks topping when on', () => {
    const contributions = selectContributions({ pm: 'pnpm', commitHooks: true });
    expect(contributions).toHaveLength(2);
    expect(contributions[0]).toBe(baseline);
  });
});

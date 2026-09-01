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

  it('contributes the react vite plugin', () => {
    expect(baseline.viteImports).toEqual(["import react from '@vitejs/plugin-react';"]);
    expect(baseline.vitePlugins).toEqual(['react()']);
  });

  it('ships .vscode settings and extension recommendations', () => {
    expect(baseline.files.map((file) => file.path)).toEqual([
      '.vscode/settings.json',
      '.vscode/extensions.json',
    ]);

    const settingsFile = baseline.files.find((file) => file.path === '.vscode/settings.json');
    const settings = JSON.parse(settingsFile?.contents ?? '{}') as Record<string, unknown>;
    expect(settings['editor.defaultFormatter']).toBe('oxc.oxc-vscode');
    // The generated app always ships oxfmt.config.ts, never the .mts variant.
    expect(settings['oxc.fmt.configPath']).toBe('oxfmt.config.ts');
    expect(settings['[typescript]']).toEqual({ 'editor.defaultFormatter': 'oxc.oxc-vscode' });

    const extensionsFile = baseline.files.find((file) => file.path === '.vscode/extensions.json');
    expect(JSON.parse(extensionsFile?.contents ?? '{}')).toEqual({
      recommendations: ['oxc.oxc-vscode'],
    });
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

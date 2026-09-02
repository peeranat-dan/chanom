import {
  chanomSettings,
  codingStandardsSkill,
  type PackageManager,
  PM_EXEC,
  RECOMMENDED_EXTENSIONS,
  skillFiles,
  skillLink,
} from '@chanom/internal';

import type { Contribution } from './domain/contribution.ts';

import { emptyContribution } from './domain/contribution.ts';

const asJson = (value: unknown): string => JSON.stringify(value, null, 2) + '\n';

/**
 * The always-present baseline: a minimal Vite + React + TS app wired to the
 * chanom shared configs. Its static source files ship as verbatim templates;
 * this contribution supplies only what the generator computes (deps, scripts,
 * the Vite plugin list).
 */
export const baseline: Contribution = {
  dependencies: ['react', 'react-dom'],
  devDependencies: [
    '@chanom/dev-config',
    '@chanom/vite-config',
    '@vitejs/plugin-react',
    '@tsconfig/vite-react',
    '@types/react',
    '@types/react-dom',
    'typescript',
    'vite',
    'vitest',
    '@vitest/coverage-v8',
    'jsdom',
    '@testing-library/react',
    '@testing-library/jest-dom',
    'oxlint',
    'oxlint-tsgolint',
    'oxfmt',
  ],
  scripts: {
    dev: 'vite',
    build: 'tsc -b && vite build',
    preview: 'vite preview',
    lint: 'oxlint',
    format: 'oxfmt',
    'format:check': 'oxfmt --check',
    test: 'vitest run',
    'test:watch': 'vitest',
  },
  viteImports: ["import react from '@vitejs/plugin-react';"],
  vitePlugins: ['react()'],
  // The generated app is always ESM and always ships `oxfmt.config.ts`, so the
  // oxc extension's config path is known statically here.
  files: [
    { path: '.vscode/settings.json', contents: asJson(chanomSettings('oxfmt.config.ts')) },
    {
      path: '.vscode/extensions.json',
      contents: asJson({ recommendations: RECOMMENDED_EXTENSIONS }),
    },
  ],
  links: [],
};

const LINT_STAGED_CONFIG = {
  '**/*.{js,jsx,ts,tsx,mjs,cjs,mts,cts}': ['oxlint --fix --no-error-on-unmatched-pattern'],
  '*': ['oxfmt --no-error-on-unmatched-pattern'],
};

const COMMITLINT_CONFIG = { extends: ['@commitlint/config-conventional'] };

/**
 * The `commit-hooks` topping: husky + lint-staged + commitlint as one unit.
 * Config choices are copied verbatim from `chanom brew`'s add-* commands. No
 * `husky init` runs at generation time (deps are not installed yet); husky's
 * `.husky/_/` materializes on the user's first install via `prepare: "husky"`.
 */
export function commitHooks(pm: PackageManager): Contribution {
  const commitMsgHook = [...PM_EXEC[pm], 'commitlint', '--edit', '$1'].join(' ') + '\n';

  return {
    dependencies: [],
    devDependencies: ['husky', 'lint-staged', '@commitlint/cli', '@commitlint/config-conventional'],
    scripts: { prepare: 'husky' },
    viteImports: [],
    vitePlugins: [],
    files: [
      { path: '.husky/pre-commit', contents: 'lint-staged\n' },
      { path: '.husky/commit-msg', contents: commitMsgHook },
      { path: '.lintstagedrc.json', contents: JSON.stringify(LINT_STAGED_CONFIG, null, 2) + '\n' },
      { path: '.commitlintrc.json', contents: JSON.stringify(COMMITLINT_CONFIG, null, 2) + '\n' },
    ],
    links: [],
  };
}

/**
 * The `agent-skills` topping: the chanom coding-standards skill. Real files go
 * to `.agents/skills/` so any agent tool can read them, and `.claude/skills/`
 * gets a symlink rather than a second copy. Contributes files and links only -
 * no packages, no scripts - so projects that skip it get neither directory.
 */
export const agentSkills: Contribution = {
  ...emptyContribution,
  files: skillFiles(codingStandardsSkill),
  links: [skillLink(codingStandardsSkill)],
};

export interface ToppingSelection {
  readonly pm: PackageManager;
  readonly commitHooks: boolean;
  readonly agentSkills: boolean;
}

/** The baseline plus whichever toppings the resolved options select, in fold order. */
export function selectContributions(selection: ToppingSelection): Contribution[] {
  const contributions: Contribution[] = [baseline];
  if (selection.commitHooks) contributions.push(commitHooks(selection.pm));
  if (selection.agentSkills) contributions.push(agentSkills);
  return contributions;
}

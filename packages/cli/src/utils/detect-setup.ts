import { existsSync } from 'node:fs';
import { join } from 'node:path';

export type SetupFile =
  | 'oxlint'
  | 'oxfmt'
  | 'knip'
  | 'husky'
  | 'lint-staged'
  | 'commitlint'
  | 'vite';

const CONFIG_FILES: Record<SetupFile, string[]> = {
  oxlint: [
    'oxlint.config.js',
    'oxlint.config.cjs',
    'oxlint.config.mjs',
    'oxlint.config.ts',
    'oxlint.config.cts',
    'oxlint.config.mts',
    '.oxlintrc.json',
  ],
  oxfmt: [
    'oxfmt.config.js',
    'oxfmt.config.cjs',
    'oxfmt.config.mjs',
    'oxfmt.config.ts',
    'oxfmt.config.cts',
    'oxfmt.config.mts',
    '.oxfmtrc.json',
  ],
  knip: ['knip.json', 'knip.ts', 'knip.config.ts', 'knip.config.mts', '.knip.json'],
  husky: ['.husky'],
  'lint-staged': ['.lintstagedrc.json', '.lintstagedrc.js', 'lint-staged.config.js'],
  commitlint: ['.commitlintrc.json', '.commitlintrc.js', 'commitlint.config.js'],
  vite: ['vite.config.ts', 'vite.config.js', 'vite.config.mjs'],
};

export function detectSetupFile(type: SetupFile, cwd = process.cwd()): string | null {
  for (const filename of CONFIG_FILES[type]) {
    const filepath = join(cwd, filename);
    if (existsSync(filepath)) {
      return filepath;
    }
  }
  return null;
}

export function detectSetup(cwd = process.cwd()): Record<SetupFile, string | null> {
  return {
    oxlint: detectSetupFile('oxlint', cwd),
    oxfmt: detectSetupFile('oxfmt', cwd),
    knip: detectSetupFile('knip', cwd),
    husky: detectSetupFile('husky', cwd),
    'lint-staged': detectSetupFile('lint-staged', cwd),
    commitlint: detectSetupFile('commitlint', cwd),
    vite: detectSetupFile('vite', cwd),
  };
}

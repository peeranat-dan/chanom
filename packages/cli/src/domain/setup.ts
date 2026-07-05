export type SetupFile =
  | 'oxlint'
  | 'oxfmt'
  | 'knip'
  | 'husky'
  | 'lint-staged'
  | 'commitlint'
  | 'vite';

export const SETUP_FILE_CANDIDATES: Record<SetupFile, string[]> = {
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

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

/** Config file name a tool gets scaffolded with, matching the project's module system. */
export function configFileName(tool: 'oxlint' | 'oxfmt' | 'knip', esm: boolean): string {
  return `${tool}.config.${esm ? 'ts' : 'mts'}`;
}

/**
 * Extensions oxlint/oxfmt resolve on their own. `.mts`/`.cts` are absent
 * deliberately: the tools only auto-discover the plain `.ts` variant, so a
 * config using one of those has to be named explicitly on the command line.
 */
const AUTO_DISCOVERED = new Set(['js', 'cjs', 'mjs', 'ts', 'json']);

/**
 * `-c <config>` argument naming the config file, or an empty string when the
 * tool finds the file by itself. `configFile` is the config that will actually
 * be on disk - the one chanom is about to write, or an existing one it detected
 * and skipped - so the generated scripts never point at a path that isn't there.
 */
export function configFlag(configFile: string): string {
  // Compared as a whole segment, not a suffix: `.mts` ends with `ts` but is
  // not auto-discovered.
  const extension = configFile.slice(configFile.lastIndexOf('.') + 1);
  return AUTO_DISCOVERED.has(extension) ? '' : ` -c ${configFile}`;
}

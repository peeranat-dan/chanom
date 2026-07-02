import { log } from '@clack/prompts';
import { existsSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';

import { detectSetupFile } from '../../utils/detect-setup.ts';
import { isPackageInstalled, type Pkg } from '../../utils/pkg.ts';

export type Linter = 'oxlint';
export type Formatter = 'oxfmt';

export function getPackages(pkg: Pkg): string[] {
  return isPackageInstalled(pkg, 'lint-staged') ? [] : ['lint-staged'];
}

export function apply(
  cwd: string,
  linters: Linter[] = [],
  formatters: Formatter[] = [],
  // The default pre-commit hook created by `husky init` is safe to replace,
  // so callers that just ran it pass true; a pre-existing hook is kept.
  overwritePreCommit = false,
): void {
  const existing = detectSetupFile('lint-staged', cwd);
  if (existing) {
    log.warn(`\`${basename(existing)}\` already exists - skipping lint-staged config`);
  } else {
    const config: Record<string, string[]> = {};

    const jsGlob = '**/*.{js,jsx,ts,tsx,mjs,cjs,mts,cts}';

    if (linters.includes('oxlint')) {
      config[jsGlob] ??= [];
      config[jsGlob].push('oxlint --fix');
    }

    if (formatters.includes('oxfmt')) {
      config['*'] ??= [];
      config['*'].push('oxfmt');
    }

    writeFileSync(join(cwd, '.lintstagedrc.json'), JSON.stringify(config, null, 2) + '\n');
  }

  if (existsSync(join(cwd, '.husky'))) {
    const hookPath = join(cwd, '.husky', 'pre-commit');
    if (existsSync(hookPath) && !overwritePreCommit) {
      log.warn('`.husky/pre-commit` already exists - skipping');
    } else {
      writeFileSync(hookPath, 'lint-staged\n');
    }
  }
}

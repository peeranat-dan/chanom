import { existsSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { isPackageInstalled, type Pkg } from '../../utils/pkg.ts';

export type Linter = 'oxlint' | 'eslint';
export type Formatter = 'oxfmt' | 'prettier';

export function getPackages(pkg: Pkg): string[] {
  return isPackageInstalled(pkg, 'lint-staged') ? [] : ['lint-staged'];
}

export function apply(
  cwd: string,
  linters: Linter[] = [],
  formatters: Formatter[] = [],
): void {
  const config: Record<string, string[]> = {};

  const jsGlob = '**/*.{js,jsx,ts,tsx,mjs,cjs,mts,cts}';

  if (linters.includes('oxlint')) {
    config[jsGlob] ??= [];
    config[jsGlob].push('oxlint --fix');
  }

  if (linters.includes('eslint')) {
    config[jsGlob] ??= [];
    config[jsGlob].push('eslint --fix');
  }

  if (formatters.includes('oxfmt')) {
    config['*'] ??= [];
    config['*'].push('oxfmt');
  }

  if (formatters.includes('prettier')) {
    config['*'] ??= [];
    config['*'].push('prettier --ignore-unknown --write');
  }

  writeFileSync(join(cwd, '.lintstagedrc.json'), JSON.stringify(config, null, 2) + '\n');

  if (existsSync(join(cwd, '.husky'))) {
    writeFileSync(join(cwd, '.husky', 'pre-commit'), 'lint-staged\n');
  }
}

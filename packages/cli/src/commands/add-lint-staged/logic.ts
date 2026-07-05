import { isPackageInstalled, type Pkg } from '../../domain/pkg.ts';

export type Linter = 'oxlint';
export type Formatter = 'oxfmt';

export function getPackages(pkg: Pkg): string[] {
  return isPackageInstalled(pkg, 'lint-staged') ? [] : ['lint-staged'];
}

export function buildConfig(
  linters: readonly Linter[],
  formatters: readonly Formatter[],
): Record<string, string[]> {
  const config: Record<string, string[]> = {};

  const jsGlob = '**/*.{js,jsx,ts,tsx,mjs,cjs,mts,cts}';

  if (linters.includes('oxlint')) {
    config[jsGlob] ??= [];
    config[jsGlob].push('oxlint --fix --no-error-on-unmatched-pattern');
  }

  if (formatters.includes('oxfmt')) {
    config['*'] ??= [];
    config['*'].push('oxfmt --no-error-on-unmatched-pattern');
  }

  return config;
}

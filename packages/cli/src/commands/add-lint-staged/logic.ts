import { isPackageInstalled, type Pkg } from '../../domain/pkg.ts';
import { configFlag } from '../../domain/setup.ts';

export type Linter = 'oxlint';
export type Formatter = 'oxfmt';

/** Config file each selected tool will run against, keyed by tool name. */
export interface ConfigFiles {
  readonly oxlint: string;
  readonly oxfmt: string;
}

export function getPackages(pkg: Pkg): string[] {
  return isPackageInstalled(pkg, 'lint-staged') ? [] : ['lint-staged'];
}

export function buildConfig(
  linters: readonly Linter[],
  formatters: readonly Formatter[],
  configFiles: ConfigFiles,
): Record<string, string[]> {
  const config: Record<string, string[]> = {};

  const jsGlob = '**/*.{js,jsx,ts,tsx,mjs,cjs,mts,cts}';

  if (linters.includes('oxlint')) {
    config[jsGlob] ??= [];
    config[jsGlob].push(
      `oxlint --fix${configFlag(configFiles.oxlint)} --no-error-on-unmatched-pattern`,
    );
  }

  if (formatters.includes('oxfmt')) {
    config['*'] ??= [];
    config['*'].push(`oxfmt${configFlag(configFiles.oxfmt)} --no-error-on-unmatched-pattern`);
  }

  return config;
}

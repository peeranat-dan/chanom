import type { ToolVersions } from '../../domain/versions.ts';

import { getMismatchedPackage, type Pkg } from '../../domain/pkg.ts';
import { planScripts, type ScriptPlan } from '../../domain/scripts.ts';

export interface ConfigFile {
  readonly fileName: string;
  readonly contents: string;
}

export function getPackages(
  pkg: Pkg,
  versions: Pick<ToolVersions, 'oxlint' | 'devConfig'>,
): string[] {
  return [
    getMismatchedPackage(pkg, 'oxlint', versions.oxlint),
    getMismatchedPackage(pkg, '@chanom/dev-config', versions.devConfig),
  ].filter((p): p is string => p !== undefined);
}

export function configFile(esm: boolean): ConfigFile {
  return {
    fileName: `oxlint.config.${esm ? 'ts' : 'mts'}`,
    contents: `export { default } from '@chanom/dev-config/oxlint/config';\n`,
  };
}

export function getScriptPlan(scripts: Readonly<Record<string, string>> | undefined): ScriptPlan {
  return planScripts(scripts, { lint: 'oxlint', 'lint:fix': 'oxlint --fix' });
}

import type { ToolVersions } from '../../domain/versions.ts';

import { getMismatchedPackage, type Pkg } from '../../domain/pkg.ts';
import { planScripts, type ScriptPlan } from '../../domain/scripts.ts';

export interface ConfigFile {
  readonly fileName: string;
  readonly contents: string;
}

export function getPackages(
  pkg: Pkg,
  versions: Pick<ToolVersions, 'oxfmt' | 'devConfig'>,
): string[] {
  return [
    getMismatchedPackage(pkg, 'oxfmt', versions.oxfmt),
    getMismatchedPackage(pkg, '@chanom/dev-config', versions.devConfig),
  ].filter((p): p is string => p !== undefined);
}

export function configFile(esm: boolean): ConfigFile {
  return {
    fileName: `oxfmt.config.${esm ? 'ts' : 'mts'}`,
    contents: `export { default } from '@chanom/dev-config/oxfmt/config';\n`,
  };
}

export function getScriptPlan(scripts: Readonly<Record<string, string>> | undefined): ScriptPlan {
  return planScripts(scripts, { format: 'oxfmt', 'format:check': 'oxfmt --check' });
}

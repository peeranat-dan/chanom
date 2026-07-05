import type { ToolVersions } from '../../domain/versions.ts';

import { isPackageInstalled, type Pkg } from '../../domain/pkg.ts';
import { planScripts, type ScriptPlan } from '../../domain/scripts.ts';

export interface ConfigFile {
  readonly fileName: string;
  readonly contents: string;
}

export function getPackages(
  pkg: Pkg,
  versions: Pick<ToolVersions, 'knip' | 'devConfig'>,
): string[] {
  return isPackageInstalled(pkg, 'knip')
    ? []
    : [`knip@${versions.knip}`, `@chanom/dev-config@${versions.devConfig}`];
}

export function configFile(esm: boolean): ConfigFile {
  return {
    fileName: `knip.config.${esm ? 'ts' : 'mts'}`,
    contents: `export { default } from '@chanom/dev-config/knip/config';\n`,
  };
}

export function getScriptPlan(scripts: Readonly<Record<string, string>> | undefined): ScriptPlan {
  return planScripts(scripts, { knip: 'knip' });
}

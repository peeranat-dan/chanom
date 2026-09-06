import type { ToolVersions } from '../../domain/versions.ts';

import { getMismatchedPackage, type Pkg } from '../../domain/pkg.ts';
import { planScripts, type ScriptPlan } from '../../domain/scripts.ts';
import { configFileName, configFlag } from '../../domain/setup.ts';

export interface ConfigFile {
  readonly fileName: string;
  readonly contents: string;
}

export function getPackages(
  pkg: Pkg,
  versions: Pick<ToolVersions, 'oxlint' | 'oxlintTsgolint' | 'devConfig'>,
): string[] {
  return [
    getMismatchedPackage(pkg, 'oxlint', versions.oxlint),
    getMismatchedPackage(pkg, 'oxlint-tsgolint', versions.oxlintTsgolint),
    getMismatchedPackage(pkg, '@chanom/dev-config', versions.devConfig),
  ].filter((p): p is string => p !== undefined);
}

export function configFile(esm: boolean): ConfigFile {
  return {
    fileName: configFileName('oxlint', esm),
    contents: `export { default } from '@chanom/dev-config/oxlint/config';\n`,
  };
}

export function getScriptPlan(
  scripts: Readonly<Record<string, string>> | undefined,
  configFile: string,
): ScriptPlan {
  const config = configFlag(configFile);
  return planScripts(scripts, {
    lint: `oxlint${config}`,
    'lint:fix': `oxlint --fix${config}`,
  });
}

import type { Contribution } from '../domain/contribution.ts';

import { toKebabCase } from '../domain/project-name.ts';
import { type DepVersions, resolveVersion } from '../domain/versions.ts';

export interface PackageJsonInput {
  readonly appName: string;
  /** `name@version` recorded into the `packageManager` field, when known. */
  readonly packageManager?: string;
  readonly contribution: Contribution;
  readonly versions: DepVersions;
}

/** Resolves each name to its exact pinned version, sorted for deterministic output. */
function toDependencyMap(names: readonly string[], versions: DepVersions): Record<string, string> {
  const map: Record<string, string> = {};
  for (const name of [...names].sort()) {
    map[name] = resolveVersion(versions, name);
  }
  return map;
}

/**
 * Renders the generated `package.json` as a string. Every dependency is pinned
 * exact from the injected catalog versions; a missing version throws rather
 * than emitting a range (see {@link resolveVersion}).
 *
 * The pnpm build allow-list lives in `pnpm-workspace.yaml`, not here: pnpm no
 * longer reads `pnpm.onlyBuiltDependencies` from `package.json` (see
 * {@link buildPnpmWorkspace}).
 */
export function buildPackageJson(input: PackageJsonInput): string {
  const pkg = {
    name: toKebabCase(input.appName),
    version: '0.0.0',
    private: true,
    type: 'module',
    ...(input.packageManager === undefined ? {} : { packageManager: input.packageManager }),
    scripts: input.contribution.scripts,
    dependencies: toDependencyMap(input.contribution.dependencies, input.versions),
    devDependencies: toDependencyMap(input.contribution.devDependencies, input.versions),
  };

  return JSON.stringify(pkg, null, 2) + '\n';
}

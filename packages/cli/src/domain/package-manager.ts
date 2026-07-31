import type { PackageManager } from '@chanom/internal';

// The package-manager basics (`PackageManager`, `PM_EXEC`, and the resolvers)
// are shared with create-chanom-app, so they live in @chanom/internal. Only the
// workspace-root install flags below are cli-specific (brew installs into an
// existing project that may be a workspace root; a scaffolder never does).
export type { PackageManager, PmHints } from '@chanom/internal';
export { parsePmField, parsePmUserAgent, PM_EXEC, resolvePm } from '@chanom/internal';

/** Signals gathered from a directory's files that mark it as a workspace root. */
export interface WorkspaceHints {
  /** `pnpm-workspace.yaml` exists (pnpm workspace root). */
  readonly hasPnpmWorkspaceFile: boolean;
  /** `package.json` has a `workspaces` field (npm/yarn/bun workspaces). */
  readonly hasWorkspacesField: boolean;
  /** `.yarnrc.yml` exists (yarn berry, which installs to the root without a flag). */
  readonly hasYarnBerryConfig: boolean;
}

/**
 * Extra `add` flags needed when installing at a workspace root: pnpm and yarn
 * classic refuse root installs without `-w` / `-W`. npm, bun, and yarn berry
 * install to the root with no flag (npm's `-w` targets a child workspace instead).
 */
export function workspaceRootFlags(pm: PackageManager, hints: WorkspaceHints): readonly string[] {
  switch (pm) {
    case 'pnpm':
      return hints.hasPnpmWorkspaceFile ? ['-w'] : [];
    case 'yarn':
      return hints.hasWorkspacesField && !hints.hasYarnBerryConfig ? ['-W'] : [];
    case 'npm':
    case 'bun':
      return [];
  }
}

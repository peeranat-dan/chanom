/**
 * Build scripts pnpm must be told to run for the generated app. pnpm v10 blocks
 * every dependency lifecycle script unless it is allow-listed; esbuild (pulled
 * in by the Vite baseline) needs its postinstall to compile its native binary,
 * so without this the very first `pnpm install` aborts with ERR_PNPM_IGNORED_BUILDS.
 *
 * This lives in `pnpm-workspace.yaml` rather than a `package.json` `pnpm` field:
 * pnpm no longer reads `pnpm.onlyBuiltDependencies` from `package.json` and warns
 * when it is present. A standalone (non-workspace) project still reads the
 * setting from `pnpm-workspace.yaml`.
 */
const onlyBuiltDependencies = ['esbuild'] as const;
const allowBuilds = ['esbuild'] as const;

/** Renders the generated `pnpm-workspace.yaml` as a string. */
export function buildPnpmWorkspace(): string {
  const lines = [
    'onlyBuiltDependencies:',
    ...onlyBuiltDependencies.map((name) => `  - ${name}`),
    'allowBuilds:',
    ...allowBuilds.map((name) => `  ${name}: true`),
  ];
  return lines.join('\n') + '\n';
}

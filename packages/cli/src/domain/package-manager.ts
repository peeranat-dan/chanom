export type PackageManager = 'pnpm' | 'npm' | 'yarn' | 'bun';

/** How to run a locally installed binary with each package manager. */
export const PM_EXEC: Record<PackageManager, string[]> = {
  pnpm: ['pnpm', 'exec'],
  npm: ['npx', '--no', '--'],
  yarn: ['yarn'],
  bun: ['bunx'],
};

const KNOWN_PMS: PackageManager[] = ['pnpm', 'yarn', 'bun', 'npm'];

/** Parses the `packageManager` field of package.json, e.g. `pnpm@11.9.0`. */
export function parsePmField(field: string | undefined): PackageManager | undefined {
  if (!field) return undefined;
  const name = field.split('@')[0];
  return KNOWN_PMS.find((pm) => pm === name);
}

/** Parses the `npm_config_user_agent` environment variable, e.g. `pnpm/11.9.0 npm/? node/v22`. */
export function parsePmUserAgent(agent: string | undefined): PackageManager | undefined {
  if (!agent) return undefined;
  return KNOWN_PMS.find((pm) => agent.startsWith(pm));
}

export interface PmHints {
  readonly packageManagerField?: string | undefined;
  readonly userAgent?: string | undefined;
  readonly fallback?: PackageManager;
}

/** The `packageManager` field wins over the user agent, which wins over the fallback. */
export function resolvePm(hints: PmHints): PackageManager {
  return (
    parsePmField(hints.packageManagerField) ??
    parsePmUserAgent(hints.userAgent) ??
    hints.fallback ??
    'pnpm'
  );
}

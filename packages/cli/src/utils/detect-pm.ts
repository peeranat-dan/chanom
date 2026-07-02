import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export type PackageManager = 'pnpm' | 'npm' | 'yarn' | 'bun';

/** How to run a locally installed binary with each package manager. */
export const PM_EXEC: Record<PackageManager, string[]> = {
  pnpm: ['pnpm', 'exec'],
  npm: ['npx', '--no', '--'],
  yarn: ['yarn'],
  bun: ['bunx'],
};

const KNOWN_PMS: PackageManager[] = ['pnpm', 'yarn', 'bun', 'npm'];

function fromPkgJson(cwd: string): PackageManager | undefined {
  const pkgPath = join(cwd, 'package.json');
  if (!existsSync(pkgPath)) return undefined;

  try {
    const { packageManager } = JSON.parse(readFileSync(pkgPath, 'utf-8')) as {
      packageManager?: string;
    };
    if (!packageManager) return undefined;

    const name = packageManager.split('@')[0] as PackageManager;
    return KNOWN_PMS.includes(name) ? name : undefined;
  } catch {
    return undefined;
  }
}

function fromUserAgent(): PackageManager | undefined {
  const agent = process.env['npm_config_user_agent'];
  if (!agent) return undefined;
  return KNOWN_PMS.find((pm) => agent.startsWith(pm));
}

export function detectPm(cwd = process.cwd(), defaultPm: PackageManager = 'pnpm'): PackageManager {
  return fromPkgJson(cwd) ?? fromUserAgent() ?? defaultPm;
}

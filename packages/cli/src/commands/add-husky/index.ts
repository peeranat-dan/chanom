import { spawnSync } from 'node:child_process';

import type { PackageManager } from '../../utils/detect-pm.ts';

import { isPackageInstalled, type Pkg } from '../../utils/pkg.ts';

const PM_EXEC: Record<PackageManager, string[]> = {
  pnpm: ['pnpm', 'exec'],
  npm: ['npx'],
  yarn: ['yarn'],
  bun: ['bunx'],
};

export function getPackages(pkg: Pkg): string[] {
  return isPackageInstalled(pkg, 'husky') ? [] : ['husky'];
}

export function apply(cwd: string, pm: PackageManager): void {
  const [cmd, ...args] = PM_EXEC[pm];
  spawnSync(cmd, [...args, 'husky', 'init'], { stdio: 'inherit', cwd });
}

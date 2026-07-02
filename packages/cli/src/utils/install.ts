import { spawnSync } from 'node:child_process';

import type { PackageManager } from './detect-pm.ts';

export function installDev(pm: PackageManager, cwd: string, ...packages: string[]): boolean {
  const result = spawnSync(pm, ['add', '-D', ...packages], { stdio: 'inherit', cwd });
  return result.status === 0;
}

import { type PackageManager, PM_EXEC } from '../../domain/package-manager.ts';
import { isPackageInstalled, type Pkg } from '../../domain/pkg.ts';

export function getPackages(pkg: Pkg): string[] {
  const missing: string[] = [];
  if (!isPackageInstalled(pkg, '@commitlint/cli')) {
    missing.push('@commitlint/cli');
  }
  if (!isPackageInstalled(pkg, '@commitlint/config-conventional')) {
    missing.push('@commitlint/config-conventional');
  }
  return missing;
}

export const CONFIG_CONTENTS =
  JSON.stringify({ extends: ['@commitlint/config-conventional'] }, null, 2) + '\n';

export function commitMsgHook(pm: PackageManager): string {
  return [...PM_EXEC[pm], 'commitlint', '--edit', '$1'].join(' ') + '\n';
}

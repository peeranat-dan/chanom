import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export interface Pkg {
  type?: 'module' | 'commonjs';
  packageManager?: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  scripts?: Record<string, string>;
}

export function isEsm(pkg: Pkg): boolean {
  return pkg.type === 'module';
}

export function readPkg(cwd: string): { pkg: Pkg; pkgPath: string } {
  const pkgPath = join(cwd, 'package.json');
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8')) as Pkg;
  return { pkg, pkgPath };
}

export function isPackageInstalled(pkg: Pkg, name: string): boolean {
  return name in (pkg.dependencies ?? {}) || name in (pkg.devDependencies ?? {});
}

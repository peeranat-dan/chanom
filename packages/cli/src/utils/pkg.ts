import { existsSync, readFileSync } from 'node:fs';
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
  if (!existsSync(pkgPath)) {
    throw new Error(`No package.json found in ${cwd}`);
  }
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8')) as Pkg;
  return { pkg, pkgPath };
}

export function isPackageInstalled(pkg: Pkg, name: string): boolean {
  return name in (pkg.dependencies ?? {}) || name in (pkg.devDependencies ?? {});
}

function stripRangePrefix(version: string): string {
  return version.replace(/^[\^~]/, '');
}

export function getOutdatedPackage(pkg: Pkg, name: string, version: string): string | undefined {
  const installed = pkg.dependencies?.[name] ?? pkg.devDependencies?.[name];
  return installed !== undefined && stripRangePrefix(installed) === version
    ? undefined
    : `${name}@${version}`;
}

import { FileSystem, Path } from '@effect/platform';
import { Data, Effect } from 'effect';

export interface Pkg {
  type?: 'module' | 'commonjs';
  packageManager?: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  scripts?: Record<string, string>;
}

export class PkgNotFound extends Data.TaggedError('PkgNotFound')<{
  readonly cwd: string;
}> {}

export function isEsm(pkg: Pkg): boolean {
  return pkg.type === 'module';
}

export const readPkg = (cwd: string) =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem;
    const path = yield* Path.Path;
    const pkgPath = path.join(cwd, 'package.json');
    const pkgExists = yield* fs.exists(pkgPath);

    if (!pkgExists) {
      return yield* new PkgNotFound({ cwd });
    }

    const pkgContent = yield* fs.readFileString(pkgPath);
    const pkg = JSON.parse(pkgContent) as Pkg;

    return { pkg, pkgPath };
  });

export function isPackageInstalled(pkg: Pkg, name: string): boolean {
  return name in (pkg.dependencies ?? {}) || name in (pkg.devDependencies ?? {});
}

function stripRangePrefix(version: string): string {
  return version.replace(/^[\^~]/, '');
}

// Flags a mismatch in either direction (older or newer), not just "outdated", since the
// generated config files must match the pinned version exactly.
export function getMismatchedPackage(pkg: Pkg, name: string, version: string): string | undefined {
  const installed = pkg.dependencies?.[name] ?? pkg.devDependencies?.[name];
  return installed !== undefined && stripRangePrefix(installed) === version
    ? undefined
    : `${name}@${version}`;
}

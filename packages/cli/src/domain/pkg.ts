import { Data } from 'effect';

export interface Pkg {
  readonly type?: 'module' | 'commonjs';
  readonly packageManager?: string;
  readonly dependencies?: Readonly<Record<string, string>>;
  readonly devDependencies?: Readonly<Record<string, string>>;
  readonly scripts?: Readonly<Record<string, string>>;
}

export class PkgNotFound extends Data.TaggedError('PkgNotFound')<{
  readonly cwd: string;
}> {}

export class PkgInvalid extends Data.TaggedError('PkgInvalid')<{
  readonly pkgPath: string;
}> {}

export function isEsm(pkg: Pkg): boolean {
  return pkg.type === 'module';
}

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

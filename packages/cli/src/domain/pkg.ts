import { Schema } from 'effect';

const StringRecord = Schema.Record(Schema.String, Schema.String);

/**
 * The package.json fields chanom reads. The rest signature keeps every other
 * field, so writing a decoded `Pkg` back does not drop them.
 */
export const Pkg = Schema.StructWithRest(
  Schema.Struct({
    type: Schema.optionalKey(Schema.Literals(['module', 'commonjs'])),
    packageManager: Schema.optionalKey(Schema.String),
    dependencies: Schema.optionalKey(StringRecord),
    devDependencies: Schema.optionalKey(StringRecord),
    scripts: Schema.optionalKey(StringRecord),
  }),
  [Schema.Record(Schema.String, Schema.Unknown)],
);
export type Pkg = typeof Pkg.Type;

export class PkgNotFound extends Schema.TaggedError<PkgNotFound>()('PkgNotFound', {
  cwd: Schema.String,
}) {}

export class PkgInvalid extends Schema.TaggedError<PkgInvalid>()('PkgInvalid', {
  pkgPath: Schema.String,
}) {}

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

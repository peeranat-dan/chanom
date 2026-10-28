import { Effect, FileSystem, Path, Schema } from 'effect';

import { type PackageManager, resolvePm } from '../domain/package-manager.ts';

const decodePackageManagerField = Schema.decodeUnknownEffect(
  Schema.fromJsonString(Schema.Struct({ packageManager: Schema.optionalKey(Schema.String) })),
);

export const detectPm = Effect.fn('detect-pm.detectPm')(function* (
  cwd: string,
  userAgent: string | undefined = process.env['npm_config_user_agent'],
  fallback: PackageManager = 'pnpm',
): Effect.fn.Return<PackageManager, never, FileSystem.FileSystem | Path.Path> {
  const fs = yield* FileSystem.FileSystem;
  const path = yield* Path.Path;
  const pkgPath = path.join(cwd, 'package.json');

  const packageManagerField = yield* fs.readFileString(pkgPath).pipe(
    Effect.flatMap(decodePackageManagerField),
    Effect.map((pkg) => pkg.packageManager),
    Effect.orElseSucceed(() => undefined),
  );

  return resolvePm({ packageManagerField, userAgent, fallback });
});

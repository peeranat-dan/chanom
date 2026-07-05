import { FileSystem, Path } from '@effect/platform';
import { Effect } from 'effect';

import { type PackageManager, resolvePm } from '../domain/package-manager.ts';

export const detectPm = (
  cwd: string,
  userAgent: string | undefined = process.env['npm_config_user_agent'],
  fallback: PackageManager = 'pnpm',
): Effect.Effect<PackageManager, never, FileSystem.FileSystem | Path.Path> =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem;
    const path = yield* Path.Path;
    const pkgPath = path.join(cwd, 'package.json');

    const packageManagerField = yield* fs.readFileString(pkgPath).pipe(
      Effect.flatMap((contents) =>
        Effect.try(() => (JSON.parse(contents) as { packageManager?: string }).packageManager),
      ),
      Effect.orElseSucceed(() => undefined),
    );

    return resolvePm({ packageManagerField, userAgent, fallback });
  });

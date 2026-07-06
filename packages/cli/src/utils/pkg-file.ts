import { FileSystem, Path } from '@effect/platform';
import { Effect } from 'effect';

import { type Pkg, PkgInvalid, PkgNotFound } from '../domain/pkg.ts';

export const readPkg = (cwd: string) =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem;
    const path = yield* Path.Path;
    const pkgPath = path.join(cwd, 'package.json');

    if (!(yield* fs.exists(pkgPath))) {
      return yield* new PkgNotFound({ cwd });
    }

    const contents = yield* fs.readFileString(pkgPath);
    const pkg = yield* Effect.try({
      try: () => JSON.parse(contents) as Pkg,
      catch: () => new PkgInvalid({ pkgPath }),
    });

    return { pkg, pkgPath };
  });

export const writePkg = (pkgPath: string, pkg: Pkg) =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem;
    yield* fs.writeFileString(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
  });

import { Effect, FileSystem, Path, Schema } from 'effect';

import { Pkg, PkgInvalid, PkgNotFound } from '../domain/pkg.ts';

const decodePkg = Schema.decodeUnknownEffect(Schema.fromJsonString(Pkg));

export const readPkg = Effect.fn('pkg-file.readPkg')(function* (cwd: string) {
  const fs = yield* FileSystem.FileSystem;
  const path = yield* Path.Path;
  const pkgPath = path.join(cwd, 'package.json');

  if (!(yield* fs.exists(pkgPath))) {
    return yield* new PkgNotFound({ cwd });
  }

  const contents = yield* fs.readFileString(pkgPath);
  const pkg = yield* decodePkg(contents).pipe(Effect.mapError(() => new PkgInvalid({ pkgPath })));

  return { pkg, pkgPath };
});

export const writePkg = Effect.fn('pkg-file.writePkg')(function* (pkgPath: string, pkg: Pkg) {
  const fs = yield* FileSystem.FileSystem;
  yield* fs.writeFileString(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
});

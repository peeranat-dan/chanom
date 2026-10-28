import { Effect, FileSystem, Path, Schema } from 'effect';

import { Pkg, PkgInvalid, PkgNotFound } from '../domain/pkg.ts';

const decodeJsonObject = Schema.decodeUnknownEffect(
  Schema.fromJsonString(Schema.Record(Schema.String, Schema.Unknown)),
);
const decodePkg = Schema.decodeUnknownEffect(Pkg);

export const readPkg = Effect.fn('pkg-file.readPkg')(function* (cwd: string) {
  const fs = yield* FileSystem.FileSystem;
  const path = yield* Path.Path;
  const pkgPath = path.join(cwd, 'package.json');

  if (!(yield* fs.exists(pkgPath))) {
    return yield* new PkgNotFound({ cwd });
  }

  const contents = yield* fs.readFileString(pkgPath);
  const pkg = yield* decodeJsonObject(contents).pipe(
    // Decoding rebuilds the object with the schema's known keys first. Spreading
    // it over the raw object keeps the file's key order, so writing it back
    // does not reorder the user's package.json.
    Effect.flatMap((raw) => decodePkg(raw).pipe(Effect.map((decoded) => ({ ...raw, ...decoded })))),
    Effect.mapError((error) => new PkgInvalid({ pkgPath, message: error.message })),
  );

  return { pkg, pkgPath };
});

export const writePkg = Effect.fn('pkg-file.writePkg')(function* (pkgPath: string, pkg: Pkg) {
  const fs = yield* FileSystem.FileSystem;
  yield* fs.writeFileString(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
});

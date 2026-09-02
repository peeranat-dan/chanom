import { FileSystem, Path } from '@effect/platform';
import { SystemError, type SystemErrorReason } from '@effect/platform/Error';
import { Effect, Layer } from 'effect';

export interface TestFs {
  /** Provides FileSystem (in-memory) and Path (posix). */
  readonly layer: Layer.Layer<FileSystem.FileSystem | Path.Path>;
  /** Absolute path -> contents. Mutated by writes; inspect it in assertions. */
  readonly files: Map<string, string>;
  /** Absolute link path -> target, as passed to `symlink`. Inspect it in assertions. */
  readonly symlinks: Map<string, string>;
}

/**
 * In-memory FileSystem backed by a Map, plus the pure posix Path layer.
 * A directory exists if it's in `dirs` or any file lives beneath it.
 * Paths in `readErrors` fail reads with a SystemError of the given reason.
 */
export const makeTestFs = (
  initialFiles: Record<string, string> = {},
  dirs: readonly string[] = [],
  readErrors: Record<string, SystemErrorReason> = {},
): TestFs => {
  const files = new Map(Object.entries(initialFiles));
  const symlinks = new Map<string, string>();

  const exists = (path: string) =>
    files.has(path) ||
    dirs.includes(path) ||
    symlinks.has(path) ||
    [...files.keys(), ...dirs].some((entry) => entry.startsWith(`${path}/`));

  const readDirectory = (path: string): string[] => {
    const prefix = `${path}/`;
    const children = new Set<string>();
    for (const entry of [...files.keys(), ...dirs]) {
      if (entry.startsWith(prefix)) {
        const first = entry.slice(prefix.length).split('/')[0];
        if (first !== '') children.add(first);
      }
    }
    return [...children];
  };

  const fileSystem = FileSystem.layerNoop({
    exists: (path) => Effect.succeed(exists(path)),
    makeDirectory: () => Effect.void,
    readDirectory: (path) => Effect.succeed(readDirectory(path)),
    readFileString: (path) => {
      const contents = files.get(path);
      const reason = readErrors[path] ?? 'NotFound';
      return contents === undefined || path in readErrors
        ? Effect.fail(
            new SystemError({
              module: 'FileSystem',
              method: 'readFileString',
              reason,
              pathOrDescriptor: path,
            }),
          )
        : Effect.succeed(contents);
    },
    writeFileString: (path, contents) =>
      Effect.sync(() => {
        files.set(path, contents);
      }),
    remove: (path) =>
      Effect.sync(() => {
        files.delete(path);
        symlinks.delete(path);
      }),
    // Recorded rather than resolved: assertions check that the right link was
    // requested, and no test double reads through a link.
    symlink: (target, path) =>
      Effect.sync(() => {
        symlinks.set(path, target);
      }),
  });

  return { layer: Layer.merge(fileSystem, Path.layer), files, symlinks };
};

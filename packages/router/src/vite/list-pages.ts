import { readdir } from 'node:fs/promises';
import { extname, sep } from 'node:path';

/** Page files under `dir` as `/`-separated paths relative to it; empty when `dir` does not exist. */
export async function listPages(dir: string, extensions: readonly string[]): Promise<string[]> {
  try {
    const entries = await readdir(dir, { recursive: true, withFileTypes: true });
    return entries
      .filter((entry) => entry.isFile() && extensions.includes(extname(entry.name)))
      .map((entry) =>
        `${entry.parentPath}${sep}${entry.name}`
          .slice(dir.length + 1)
          .split(sep)
          .join('/'),
      )
      .toSorted();
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') return [];
    throw error;
  }
}

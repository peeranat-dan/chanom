import type { PageDir } from '../types.ts';

import joinSegments from './join-segments.ts';

/** Adds the URL pattern of every index and page under `dir` to `paths`. */
export default function visitDir(
  dir: PageDir,
  parents: readonly string[],
  paths: Set<string>,
): void {
  const base = dir.path === undefined ? parents : [...parents, dir.path];
  if (dir.index !== undefined) paths.add(joinSegments(base));
  for (const page of dir.pages) paths.add(joinSegments([...base, page.path]));
  for (const child of dir.dirs) visitDir(child, base, paths);
}

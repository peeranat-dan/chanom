import type { PageTree } from './types.ts';

import visitDir from './utils/visit-dir.ts';

/** Every navigable URL pattern in the tree, sorted, e.g. `/posts/:id`. Layouts and 404 are not navigable. */
export default function collectPaths(tree: PageTree): readonly string[] {
  const paths = new Set<string>();
  visitDir(tree.root, [], paths);
  return [...paths].toSorted();
}

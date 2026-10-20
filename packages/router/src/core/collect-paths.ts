import type { PageDir, PageTree } from './scan-pages.ts';

/** Every navigable URL pattern in the tree, e.g. `/posts/:id`. Layouts and 404 are not navigable. */
export function collectPaths(tree: PageTree): readonly string[] {
  const paths = new Set<string>();
  visit(tree.root, [], paths);
  return [...paths].toSorted();
}

function visit(dir: PageDir, parents: readonly string[], paths: Set<string>): void {
  const base = dir.path === undefined ? parents : [...parents, dir.path];
  if (dir.index !== undefined) paths.add(join(base));
  for (const page of dir.pages) paths.add(join([...base, page.path]));
  for (const child of dir.dirs) visit(child, base, paths);
}

function join(segments: readonly string[]): string {
  return `/${segments.filter(Boolean).join('/')}`;
}

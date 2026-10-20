import type { PageTree } from './types.ts';

import commonDir from './utils/common-dir.ts';
import createDraft from './utils/create-draft.ts';
import dirAt from './utils/dir-at.ts';
import finalizeDir from './utils/finalize-dir.ts';

const EXTENSION = /\.[^./]+$/;

/**
 * Builds the route tree from page file paths, e.g. `./pages/posts/[id].tsx`.
 * `root` is stripped from every path and defaults to their shared folder. Each
 * entry keeps the original `file` key so callers can look its module up again.
 */
export default function scanPages(files: readonly string[], root = commonDir(files)): PageTree {
  const draft = createDraft();
  let app: string | undefined;
  let notFound: string | undefined;

  for (const file of files) {
    const parts = file.slice(root.length).replace(EXTENSION, '').split('/');
    const name = parts.pop() ?? '';
    // Underscore-prefixed folders and files are private (components, utils, ...).
    if (parts.some((part) => part.startsWith('_'))) continue;

    if (parts.length === 0 && name === '_app') app = file;
    else if (parts.length === 0 && name === '404') notFound = file;
    else if (name === '_layout') dirAt(draft, parts).layout = file;
    else if (name === 'index') dirAt(draft, parts).index = file;
    else if (!name.startsWith('_')) dirAt(draft, parts).pages.set(name, file);
  }

  return { app, notFound, root: finalizeDir(draft, undefined) };
}

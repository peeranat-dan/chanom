import { parseSegment, segmentPath } from './segment.ts';

/** A folder under the pages root. `path` is undefined for the root and `(group)` folders. */
export interface PageDir {
  readonly path: string | undefined;
  readonly layout: string | undefined;
  readonly index: string | undefined;
  readonly pages: readonly PageFile[];
  readonly dirs: readonly PageDir[];
}

export interface PageFile {
  readonly path: string;
  readonly file: string;
}

export interface PageTree {
  readonly app: string | undefined;
  readonly notFound: string | undefined;
  readonly root: PageDir;
}

interface DraftDir {
  layout?: string;
  index?: string;
  readonly pages: Map<string, string>;
  readonly dirs: Map<string, DraftDir>;
}

const EXTENSION = /\.[^./]+$/;

/**
 * Builds the route tree from page file paths relative to the pages root, e.g.
 * `posts/[id].tsx`. Each entry keeps the original `file` key so callers can
 * look its module up again.
 */
export function scanPages(files: readonly string[], root = commonDir(files)): PageTree {
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

  return { app, notFound, root: finalize(draft, undefined) };
}

/** The longest shared folder prefix of `files`, including its trailing slash. */
export function commonDir(files: readonly string[]): string {
  const [first = ''] = files;
  let prefix = first.slice(0, first.lastIndexOf('/') + 1);
  for (const file of files) {
    while (!file.startsWith(prefix)) {
      prefix = prefix.slice(0, prefix.lastIndexOf('/', prefix.length - 2) + 1);
    }
  }
  return prefix;
}

function createDraft(): DraftDir {
  return { pages: new Map(), dirs: new Map() };
}

function dirAt(root: DraftDir, parts: readonly string[]): DraftDir {
  let dir = root;
  for (const part of parts) {
    let next = dir.dirs.get(part);
    if (!next) {
      next = createDraft();
      dir.dirs.set(part, next);
    }
    dir = next;
  }
  return dir;
}

function finalize(draft: DraftDir, path: string | undefined): PageDir {
  const pages: PageFile[] = [];
  for (const [name, file] of draft.pages) {
    const sibling = draft.dirs.get(name);
    // `posts.tsx` next to `posts/` is the folder's index, so both never compete for `/posts`.
    if (sibling && sibling.index === undefined) sibling.index = file;
    else pages.push({ path: segmentPath(parseSegment(name)) ?? '', file });
  }

  const dirs = [...draft.dirs].map(([name, dir]) => finalize(dir, segmentPath(parseSegment(name))));
  return { path, layout: draft.layout, index: draft.index, pages, dirs };
}

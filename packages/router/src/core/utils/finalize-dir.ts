import type { DraftDir, PageDir, PageFile } from '../types.ts';

import parseSegment from '../parse-segment.ts';
import segmentPath from '../segment-path.ts';

/** Freezes a draft folder (and its subfolders) into a {@link PageDir} with route path segments. */
export default function finalizeDir(draft: DraftDir, path: string | undefined): PageDir {
  const pages: PageFile[] = [];
  for (const [name, file] of draft.pages) {
    const sibling = draft.dirs.get(name);
    // `posts.tsx` next to `posts/` is the folder's index, so both never compete for `/posts`.
    if (sibling && sibling.index === undefined) sibling.index = file;
    else pages.push({ path: segmentPath(parseSegment(name)) ?? '', file });
  }

  const dirs = [...draft.dirs].map(([name, dir]) =>
    finalizeDir(dir, segmentPath(parseSegment(name))),
  );
  return { path, layout: draft.layout, index: draft.index, pages, dirs };
}

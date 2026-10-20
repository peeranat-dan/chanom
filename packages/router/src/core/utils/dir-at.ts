import type { DraftDir } from '../types.ts';

import createDraft from './create-draft.ts';

/** The draft folder at `parts` below `root`, creating missing folders on the way. */
export default function dirAt(root: DraftDir, parts: readonly string[]): DraftDir {
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

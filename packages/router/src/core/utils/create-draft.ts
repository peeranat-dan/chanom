import type { DraftDir } from '../types.ts';

export default function createDraft(): DraftDir {
  return { pages: new Map(), dirs: new Map() };
}

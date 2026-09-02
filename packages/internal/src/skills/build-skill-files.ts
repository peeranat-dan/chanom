/**
 * Build-time only: reads the authored markdown under `coding-standards/` and
 * emits it as a `SkillFile[]`. Imported by each consumer's tsdown config and
 * inlined via `define`, so the markdown files themselves never need to ship —
 * the `.md` files stay the single source of truth and remain editable as
 * ordinary markdown rather than as escaped string literals.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

import type { SkillFile } from './index.ts';

const toPosix = (value: string): string => value.split(sep).join('/');

const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });

/** Every `.md` file under `coding-standards/`, keyed by its path within the skill. */
export function readCodingStandardsFiles(): SkillFile[] {
  const root = join(import.meta.dirname, 'coding-standards');

  return walk(root)
    .filter((file) => file.endsWith('.md'))
    .map((file) => ({
      path: toPosix(relative(root, file)),
      contents: readFileSync(file, 'utf-8'),
    }))
    .sort((a, b) => a.path.localeCompare(b.path));
}

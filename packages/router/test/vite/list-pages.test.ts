import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import listPages from '../../src/vite/list-pages.ts';

let dir = '';

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'chanom-router-'));
});

afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

describe('listPages', () => {
  it('lists nested files with matching extensions, relative and sorted', async () => {
    await mkdir(join(dir, 'posts'));
    await writeFile(join(dir, 'index.tsx'), '');
    await writeFile(join(dir, 'posts', '[id].tsx'), '');
    await writeFile(join(dir, 'styles.css'), '');

    expect(await listPages(dir, ['.tsx'])).toEqual(['index.tsx', 'posts/[id].tsx']);
  });

  it('is empty when the folder does not exist', async () => {
    expect(await listPages(join(dir, 'missing'), ['.tsx'])).toEqual([]);
  });
});

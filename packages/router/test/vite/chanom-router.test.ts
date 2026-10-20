import type { Plugin, ResolvedConfig, ViteDevServer } from 'vite';

import { EventEmitter } from 'node:events';
import { mkdir, mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import chanomRouter from '../../src/vite/chanom-router.ts';

let root = '';

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), 'chanom-router-vite-'));
  await mkdir(join(root, 'src', 'pages', 'posts'), { recursive: true });
  await writeFile(join(root, 'src', 'pages', 'index.tsx'), '');
  await writeFile(join(root, 'src', 'pages', 'posts', '[id].tsx'), '');
});

afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});

// Vite hooks may be functions or `{ handler }` objects; this plugin only uses functions.
function call(hook: unknown, ...args: unknown[]): unknown {
  if (typeof hook !== 'function') throw new Error('expected a function hook');
  return hook(...args);
}

async function start(plugin: Plugin): Promise<void> {
  await call(plugin.configResolved, { root } as ResolvedConfig);
  await call(plugin.buildStart);
}

describe('chanomRouter', () => {
  it('writes the registered paths on build start', async () => {
    await start(chanomRouter());

    const source = await readFile(join(root, 'src', 'router.gen.ts'), 'utf8');
    expect(source).toContain("      | '/'\n      | '/posts/:id';");
  });

  it('honors custom pagesDir and output', async () => {
    await mkdir(join(root, 'app', 'routes'), { recursive: true });
    await writeFile(join(root, 'app', 'routes', 'about.tsx'), '');

    await start(chanomRouter({ pagesDir: 'app/routes', output: 'app/routes.gen.ts' }));

    expect(await readFile(join(root, 'app', 'routes.gen.ts'), 'utf8')).toContain(
      "paths:\n      | '/about';",
    );
  });

  it('leaves an up-to-date file untouched', async () => {
    const plugin = chanomRouter();
    await start(plugin);
    const output = join(root, 'src', 'router.gen.ts');
    const before = (await stat(output)).mtimeMs;

    await new Promise((resolve) => setTimeout(resolve, 20));
    await call(plugin.buildStart);

    expect((await stat(output)).mtimeMs).toBe(before);
  });

  it('regenerates when a page is added in dev, ignoring files outside pages', async () => {
    const plugin = chanomRouter();
    await start(plugin);
    const watcher = new EventEmitter();
    const error = vi.fn();
    call(plugin.configureServer, {
      watcher,
      config: { logger: { error } },
    } as unknown as ViteDevServer);

    const page = join(root, 'src', 'pages', 'about.tsx');
    await writeFile(page, '');
    watcher.emit('add', page);
    watcher.emit('add', join(root, 'src', 'other.tsx'));

    await vi.waitFor(async () => {
      expect(await readFile(join(root, 'src', 'router.gen.ts'), 'utf8')).toContain("| '/about'");
    });
    expect(error).not.toHaveBeenCalled();
  });
});

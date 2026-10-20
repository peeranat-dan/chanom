import type { Plugin } from 'vite';

import { readFile, writeFile } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';

import collectPaths from '../core/collect-paths.ts';
import scanPages from '../core/scan-pages.ts';
import generateTypes from './generate-types.ts';
import listPages from './list-pages.ts';

export interface RouterPluginOptions {
  /** Folder holding your pages, relative to the Vite root. Defaults to `src/pages`. */
  readonly pagesDir?: string;
  /** Where to write the generated path types, relative to the Vite root. Defaults to `src/router.gen.ts`. */
  readonly output?: string;
  /** Page file extensions; keep in sync with your `import.meta.glob`. Defaults to `.tsx` and `.jsx`. */
  readonly extensions?: readonly string[];
}

/**
 * Generates the `Register` declaration that types `@chanom/router` from your
 * pages folder, and keeps it in sync while the dev server runs.
 */
export default function chanomRouter(options: RouterPluginOptions = {}): Plugin {
  const extensions = options.extensions ?? ['.tsx', '.jsx'];
  let pagesDir = '';
  let output = '';

  const generate = async (): Promise<void> => {
    const files = await listPages(pagesDir, extensions);
    const source = generateTypes(collectPaths(scanPages(files, '')));
    const current = await readFile(output, 'utf8').catch(() => undefined);
    // Skipping identical writes avoids retriggering file watchers and type checkers.
    if (current !== source) await writeFile(output, source);
  };

  return {
    name: '@chanom/router',
    configResolved(config) {
      pagesDir = resolve(config.root, options.pagesDir ?? 'src/pages');
      output = resolve(config.root, options.output ?? 'src/router.gen.ts');
    },
    async buildStart() {
      await generate();
    },
    configureServer(server) {
      const onChange = (file: string): void => {
        if (!file.startsWith(pagesDir + sep)) return;
        if (extname(file) !== '' && !extensions.includes(extname(file))) return;
        generate().catch((error: unknown) => server.config.logger.error(String(error)));
      };
      server.watcher.on('add', onChange);
      server.watcher.on('unlink', onChange);
      server.watcher.on('unlinkDir', onChange);
    },
  };
}

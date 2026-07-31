import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Build-time reader for the pnpm workspace catalog. Both `@chanom/cli` and
 * `create-chanom-app` inject pinned versions into their bundles from a single
 * source of truth (`pnpm-workspace.yaml`), so this lives in the shared package
 * even though it is only ever imported by `tsdown.config.ts` build tooling.
 *
 * This module reads the filesystem and must not be pulled into any runtime
 * bundle; it is deliberately absent from `src/index.ts`.
 */

// This file lives at packages/internal/src/catalog/, four levels below the root.
const workspacePath = join(import.meta.dirname, '..', '..', '..', '..', 'pnpm-workspace.yaml');

// Matches one `key: value` catalog entry, where the key may be quoted (scoped
// packages like '@types/react' always are) or bare (like `oxlint`).
const ENTRY = /^(['"]?)(.+?)\1\s*:\s*(.+)$/;

const lookup = (tool: string): string | undefined => {
  const workspace = readFileSync(workspacePath, 'utf-8');
  let inCatalog = false;

  for (const line of workspace.split('\n')) {
    if (/^catalog:\s*$/.test(line)) {
      inCatalog = true;
      continue;
    }
    if (!inCatalog) continue;
    // A non-indented, non-empty line ends the catalog block (e.g. `catalogMode:`).
    if (line.trim() !== '' && line === line.trimStart()) break;

    const match = ENTRY.exec(line.trim());
    if (match !== null && match[2] === tool && match[3].trim() !== '') {
      return match[3].trim();
    }
  }
  return undefined;
};

/**
 * Version of `tool` from the workspace catalog, or `"latest"` when it is
 * absent. Safe for consumers where a missing pin is benign.
 */
export const catalogVersion = (tool: string): string => lookup(tool) ?? 'latest';

/**
 * Version of `tool` from the workspace catalog, throwing when it is absent.
 *
 * `create-chanom-app` pins every generated dependency exactly, so a missing
 * catalog key must fail the build rather than silently ship `"latest"`.
 */
export const catalogVersionStrict = (tool: string): string => {
  const version = lookup(tool);
  if (version === undefined) {
    throw new Error(
      `No catalog version for "${tool}" in pnpm-workspace.yaml. ` +
        `Add it under \`catalog:\` before building create-chanom-app.`,
    );
  }
  return version;
};

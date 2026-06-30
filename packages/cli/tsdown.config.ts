import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { defineConfig } from 'tsdown';

const workspace = readFileSync(join(import.meta.dirname, '../../pnpm-workspace.yaml'), 'utf-8');
const oxlintVersion = workspace.match(/^\s+oxlint:\s+(.+)$/m)?.[1] ?? 'latest';
const oxfmtVersion = workspace.match(/^\s+oxfmt:\s+(.+)$/m)?.[1] ?? 'latest';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  clean: true,
  outExtensions: () => ({ js: '.js', dts: '.d.ts' }),
  define: {
    __OXLINT_VERSION__: JSON.stringify(oxlintVersion),
    __OXFMT_VERSION__: JSON.stringify(oxfmtVersion),
  },
});

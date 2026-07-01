import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: [
    'src/oxfmt/index.ts',
    'src/oxfmt/base-config.ts',
    'src/oxlint/index.ts',
    'src/oxlint/base-config.ts',
    'src/knip/index.ts',
    'src/knip/base-config.ts',
  ],
  format: ['esm'],
  dts: true,
  clean: true,
  // Emit .js / .d.ts (package is type:module) to match the package.json exports map.
  outExtensions: () => ({ js: '.js', dts: '.d.ts' }),
  // oxfmt, oxlint, and knip are peer deps, never bundle them into the config output.
  deps: {
    neverBundle: ['oxfmt', 'oxlint', 'knip'],
  },
});

import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: [
    'src/oxfmt/index.ts',
    'src/oxfmt/base-config.ts',
    'src/oxlint/index.ts',
    'src/oxlint/base-config.ts',
    'src/knip/index.ts',
    'src/knip/base-config.ts',
    'src/bin.ts',
  ],
  format: ['esm'],
  // Mirror src/ file for file so consumers reading node_modules see each config
  // in its own module instead of hashed shared chunks.
  unbundle: true,
  dts: true,
  clean: true,
  // Emit .js / .d.ts (package is type:module) to match the package.json exports map.
  outExtensions: () => ({ js: '.js', dts: '.d.ts' }),
  // oxfmt, oxlint, and knip are peer deps, never bundle them into the config output.
  deps: {
    neverBundle: ['oxfmt', 'oxlint', 'knip'],
  },
});

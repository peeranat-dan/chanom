import type { UserConfig } from 'tsdown';

import { defineConfig } from 'tsdown';

const shared: UserConfig = {
  format: ['esm'],
  dts: true,
  // Emit .js / .d.ts (package is type:module) to match the package.json exports map.
  outExtensions: () => ({ js: '.js', dts: '.d.ts' }),
};

export default defineConfig([
  {
    ...shared,
    entry: ['src/index.ts'],
    // Browser-facing runtime: no Node built-ins may sneak into the bundle.
    platform: 'neutral',
    clean: true,
  },
  {
    ...shared,
    // The Vite plugin runs in Node and reads the pages directory from disk.
    entry: ['src/vite.ts'],
    platform: 'node',
  },
]);

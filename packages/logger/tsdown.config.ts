import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  clean: true,
  // Emit .js / .d.ts (package is type:module) to match the package.json exports map.
  outExtensions: () => ({ js: '.js', dts: '.d.ts' }),
});

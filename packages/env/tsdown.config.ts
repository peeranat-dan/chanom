import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: ['src/index.ts', 'src/vite.ts'],
  format: ['esm'],
  dts: true,
  clean: true,
  // Emit .js / .d.ts (package is type:module) to match the package.json exports map.
  outExtensions: () => ({ js: '.js', dts: '.d.ts' }),
  // vite is an optional peer, only needed by the `./vite` entry. Never bundle it.
  deps: {
    neverBundle: ['vite'],
  },
});

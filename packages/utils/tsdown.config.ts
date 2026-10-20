import { defineConfig } from 'tsdown';

export default defineConfig({
  // One entry per util so each is importable on its own via `@chanom/utils/<name>`.
  entry: ['src/index.ts', 'src/*/index.ts'],
  format: ['esm'],
  // Browser-facing library: no Node built-ins may sneak into the bundle.
  platform: 'neutral',
  dts: true,
  clean: true,
  // Emit .js / .d.ts (package is type:module) to match the package.json exports map.
  outExtensions: () => ({ js: '.js', dts: '.d.ts' }),
});

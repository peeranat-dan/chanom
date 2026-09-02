import { defineConfig } from 'vitest/config';

import { readCodingStandardsFiles } from '../internal/src/skills/build-skill-files.ts';
import { CATALOG_PACKAGES, WORKSPACE_PACKAGES } from './src/domain/catalog-packages.ts';

// Build-time version constants normally injected by tsdown; tests use a
// recognizable fake for every dependency the generator can emit.
const testDepVersions = Object.fromEntries([
  ...CATALOG_PACKAGES.map((name) => [name, '1.0.0-test']),
  ...WORKSPACE_PACKAGES.map((workspace) => [workspace.name, '1.0.0-test']),
]);

export default defineConfig({
  define: {
    // The real authored markdown, so tests assert on shipped content.
    __CODING_STANDARDS_FILES__: JSON.stringify(readCodingStandardsFiles()),
    __PKG_VERSION__: JSON.stringify('0.0.0-test'),
    __DEP_VERSIONS__: JSON.stringify(testDepVersions),
  },
  test: {
    include: ['test/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      // index.ts only wires live layers to the process; env.d.ts is type-only;
      // catalog-packages.ts is a build-time data list consumed by tsdown.config.
      exclude: ['src/index.ts', 'src/env.d.ts', 'src/domain/catalog-packages.ts'],
      reporter: ['text', 'html', 'lcov'],
      // 100% aim, 90% enforced floor (see spec §8.1).
      thresholds: {
        statements: 90,
        branches: 90,
        functions: 90,
        lines: 90,
      },
    },
  },
});

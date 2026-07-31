import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['test/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      // The barrels only re-export, and testing/ holds the in-memory doubles the
      // other packages consume - both are exercised indirectly, not unit-tested.
      exclude: ['src/index.ts', 'src/testing/**'],
      reporter: ['text', 'html', 'lcov'],
      thresholds: {
        statements: 100,
        branches: 100,
        functions: 100,
        lines: 100,
      },
    },
  },
});

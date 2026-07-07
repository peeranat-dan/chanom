import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Build-time constants normally injected by tsdown; tests use recognizable fakes.
  define: {
    __OXLINT_VERSION__: JSON.stringify('1.0.0-test.oxlint'),
    __OXFMT_VERSION__: JSON.stringify('1.0.0-test.oxfmt'),
    __KNIP_VERSION__: JSON.stringify('1.0.0-test.knip'),
    __DEV_CONFIG_VERSION__: JSON.stringify('1.0.0-test.dev-config'),
  },
  test: {
    include: ['test/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      // index.ts only wires live layers to the process; env.d.ts and
      // domain/versions.ts are type-only, with no runtime code to cover.
      exclude: ['src/index.ts', 'src/env.d.ts', 'src/domain/versions.ts'],
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

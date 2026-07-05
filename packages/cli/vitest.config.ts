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
  },
});

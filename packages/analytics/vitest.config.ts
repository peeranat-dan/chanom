import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['test/**/*.test.ts'],
    // Providers must behave in non-browser runtimes (SSR); tests stub window/document
    // explicitly where a browser is expected, so plain node is the right environment.
    unstubGlobals: true,
  },
});

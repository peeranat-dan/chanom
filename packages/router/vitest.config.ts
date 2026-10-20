import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['test/**/*.test.{ts,tsx}'],
    // Route building, href, and the Vite plugin are environment-agnostic; component
    // tests opt into jsdom with a `@vitest-environment jsdom` docblock.
    unstubGlobals: true,
  },
});

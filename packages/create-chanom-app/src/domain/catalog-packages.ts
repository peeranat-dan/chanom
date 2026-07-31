/**
 * Every package name the generator can emit into a generated `package.json`,
 * grouped by where its pinned version comes from. Consumed by `tsdown.config.ts`
 * at build time to assemble the injected version map (`__DEP_VERSIONS__`); a
 * missing catalog key fails the build (see `catalogVersionStrict`).
 */

/** Names resolved from the workspace catalog in `pnpm-workspace.yaml`. */
export const CATALOG_PACKAGES = [
  'react',
  'react-dom',
  '@vitejs/plugin-react',
  '@tsconfig/vite-react',
  '@types/react',
  '@types/react-dom',
  'typescript',
  'vite',
  'vitest',
  '@vitest/coverage-v8',
  'jsdom',
  '@testing-library/react',
  '@testing-library/jest-dom',
  'oxlint',
  'oxlint-tsgolint',
  'oxfmt',
  'husky',
  'lint-staged',
  '@commitlint/cli',
  '@commitlint/config-conventional',
] as const;

/** Workspace config packages whose versions come from their own `package.json`. */
export const WORKSPACE_PACKAGES = [
  { name: '@chanom/dev-config', dir: 'dev-config' },
  { name: '@chanom/vite-config', dir: 'vite-config' },
] as const;

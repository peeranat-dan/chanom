import { type PluginOption } from 'vite';
import { type ViteUserConfig, defineConfig, mergeConfig } from 'vitest/config';

/** The `test` block of a Vitest config, with `undefined` removed. */
type TestOptions = NonNullable<ViteUserConfig['test']>;
/** The `coverage` block of a Vitest config, with `undefined` removed. */
type CoverageConfig = NonNullable<TestOptions['coverage']>;

/**
 * Coverage options, deep-merged over v8 defaults. Only the fields most projects
 * touch are surfaced here; anything else can be set through `override`.
 */
export interface CoverageOptions {
  /** Coverage provider. Defaults to `"v8"` (install `@vitest/coverage-v8`). */
  provider?: 'v8' | 'istanbul';
  /** Files to include in the report. Defaults to `["src/**\/*.{ts,tsx}"]`. */
  include?: string[];
  /** Files to exclude from the report. */
  exclude?: string[];
  /** Reporters. Defaults to `["text", "html", "lcov"]`. */
  reporter?: string[];
  /** Fail the run when coverage drops below these percentages. */
  thresholds?: {
    statements?: number;
    branches?: number;
    functions?: number;
    lines?: number;
  };
}

export interface CreateVitestConfigOptions {
  /**
   * Test environment. The base config defaults to `"node"`; the React presets
   * default to `"jsdom"` (install `jsdom`).
   */
  environment?: string;
  /**
   * Glob(s) matching test files. Defaults to
   * `["{src,test}/**\/*.{test,spec}.{ts,tsx}"]`, covering both colocated and
   * separate test directories.
   */
  include?: string[];
  /**
   * Register global test APIs (`describe`/`it`/`expect`) so tests need no
   * imports. The base config defaults to `false`; the React presets default to
   * `true`.
   */
  globals?: boolean;
  /** Files run once before each test file (e.g. `@testing-library/jest-dom`). */
  setupFiles?: string | string[];
  /**
   * Process CSS during tests. The base config and library preset leave it off;
   * the app preset defaults it to `true` so CSS-module imports resolve.
   */
  css?: boolean;
  /**
   * Plugins to apply. Pass framework plugins here (e.g. `@vitejs/plugin-react`)
   * so this package stays free of framework peer deps.
   */
  plugins?: PluginOption[];
  /**
   * Coverage. Pass `true` for v8 defaults, an object to tweak them, or omit to
   * leave coverage off. Requires `@vitest/coverage-v8` in the consumer.
   */
  coverage?: boolean | CoverageOptions;
}

/** Merge caller coverage options over the opinionated v8 defaults. */
function buildCoverage(coverage: boolean | CoverageOptions): CoverageConfig {
  const defaults: CoverageOptions = {
    provider: 'v8',
    include: ['src/**/*.{ts,tsx}'],
    reporter: ['text', 'html', 'lcov'],
  };
  const merged = coverage === true ? defaults : { ...defaults, ...coverage };
  // The `test.coverage` type is a provider-keyed union that our flat options
  // object can't narrow into; the shape matches, so assert it here.
  return merged as CoverageConfig;
}

/**
 * Create a base Vitest config.
 *
 * Applies opinionated defaults (Node environment, test globs, optional
 * coverage), then deep-merges `override` on top via Vite's `mergeConfig`, so
 * the caller always wins. This is the foundation the React presets build on.
 *
 * @example
 * // Node/library-agnostic tests
 * export default createVitestConfig({ coverage: true });
 */
export function createVitestConfig(
  options: CreateVitestConfigOptions = {},
  override: ViteUserConfig = {},
): ViteUserConfig {
  const {
    environment = 'node',
    include = ['{src,test}/**/*.{test,spec}.{ts,tsx}'],
    globals = false,
    setupFiles,
    css,
    plugins = [],
    coverage,
  } = options;

  const test: TestOptions = { environment, include, globals };
  if (setupFiles !== undefined) test.setupFiles = setupFiles;
  if (css !== undefined) test.css = css;
  if (coverage) test.coverage = buildCoverage(coverage);

  const base: ViteUserConfig = { plugins, test };

  return defineConfig(mergeConfig(base, override));
}

/**
 * Create a Vitest config for a React component library.
 *
 * Builds on {@link createVitestConfig} with a `jsdom` environment and global
 * test APIs, the usual setup for rendering components. Pass the React plugin
 * (and any setup files) through `options`.
 *
 * @example
 * import react from '@vitejs/plugin-react';
 *
 * export default createReactLibraryVitestConfig({
 *   plugins: [react()],
 *   setupFiles: ['./test/setup.ts'],
 * });
 */
export function createReactLibraryVitestConfig(
  options: CreateVitestConfigOptions = {},
  override: ViteUserConfig = {},
): ViteUserConfig {
  return createVitestConfig(
    { environment: 'jsdom', globals: true, css: false, ...options },
    override,
  );
}

/**
 * Create a Vitest config for a React application.
 *
 * Like {@link createReactLibraryVitestConfig}, but also processes CSS during
 * tests (`css: true`) since app components commonly import stylesheets and CSS
 * modules. Pass the React plugin (and any setup files) through `options`.
 *
 * @example
 * import react from '@vitejs/plugin-react';
 *
 * export default createReactAppVitestConfig({
 *   plugins: [react()],
 *   setupFiles: ['./test/setup.ts'],
 * });
 */
export function createReactAppVitestConfig(
  options: CreateVitestConfigOptions = {},
  override: ViteUserConfig = {},
): ViteUserConfig {
  return createVitestConfig(
    { environment: 'jsdom', globals: true, css: true, ...options },
    override,
  );
}

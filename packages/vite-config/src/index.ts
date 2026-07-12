import { type UserConfig, type PluginOption, mergeConfig, defineConfig } from 'vite';

/**
 * Library build options. When provided, `createViteConfig` wires up
 * Vite's library mode (`build.lib`) and sensible externalization.
 */
export interface LibOptions {
  /** Entry file(s) for the library. */
  entry: string | string[] | Record<string, string>;
  /** Output formats. Defaults to `["es", "cjs"]`. */
  formats?: ('es' | 'cjs' | 'umd' | 'iife')[];
  /** Global UMD/IIFE name. Required only for `umd`/`iife` formats. */
  name?: string;
  /**
   * Module names to keep external (not bundled). Strings match exactly or as a
   * prefix (e.g. `"react"` also externalizes `"react/jsx-runtime"`).
   * Defaults to externalizing `react` and `react-dom`.
   */
  external?: string[];
}

export interface CreateViteConfigOptions {
  /** Build target. Defaults to `"esnext"`. */
  target?: string | string[];
  /**
   * Emit sourcemaps. Defaults to `true` for library builds (consumers debug
   * into them) and `false` for web app builds, so app source isn't exposed
   * publicly. Set explicitly to override.
   */
  sourcemap?: boolean;
  /**
   * Plugins to apply. Pass framework plugins here (e.g. `@vitejs/plugin-react`,
   * `vite-plugin-dts`) so this package stays free of framework peer deps.
   */
  plugins?: PluginOption[];
  /** When set, configures Vite library mode. */
  lib?: LibOptions;
  /**
   * Emit a bundle-size treemap via `rollup-plugin-visualizer`. Pass `true` for
   * defaults, or an options object forwarded to the plugin.
   *
   * Requires `rollup-plugin-visualizer` to be installed by the consumer;
   * it is loaded lazily so it stays an optional dependency.
   */
  visualize?: boolean | VisualizerOptions;
}

/** Subset of `rollup-plugin-visualizer` options we forward. */
export interface VisualizerOptions {
  /** Output file. Defaults to `"stats.html"`. */
  filename?: string;
  /** Treemap / sunburst / network / list / raw-data / flamegraph. */
  template?: 'treemap' | 'sunburst' | 'network' | 'list' | 'raw-data' | 'flamegraph';
  /** Open the report in the browser after build. */
  open?: boolean;
  /** Include gzip sizes. */
  gzipSize?: boolean;
  /** Include brotli sizes. */
  brotliSize?: boolean;
}

/** Turn a list of external names into a Rollup `external` predicate. */
function toExternal(external: string[]): (id: string) => boolean {
  return (id) => {
    return external.some((name) => id === name || id.startsWith(`${name}/`));
  };
}

/**
 * Create an optimized Vite config.
 *
 * Applies opinionated defaults (build target, sourcemaps, optional library mode
 * and bundle visualization), then deep-merges `override` on top via Vite's
 * `mergeConfig`, so the caller always wins.
 *
 * Returns a promise because the visualizer plugin is loaded lazily; Vite
 * supports an async default export from the config file.
 *
 * @example
 * // React app
 * export default createViteConfig({ plugins: [react()] });
 *
 * @example
 * // Library with bundle treemap
 * export default createViteConfig(
 *   { lib: { entry: "src/index.ts" }, plugins: [dts()], visualize: true },
 *   { build: { minify: false } },
 * );
 */
async function createViteConfig(
  options: CreateViteConfigOptions = {},
  override: UserConfig = {},
): Promise<UserConfig> {
  const { target = 'esnext', plugins = [], lib, visualize } = options;

  // Default sourcemaps on for libraries (consumers debug into them) but off for
  // web apps, so app source isn't shipped publicly. Honor an explicit value.
  const sourcemap = options.sourcemap ?? lib !== undefined;

  const allPlugins: PluginOption[] = [...plugins];

  if (visualize) {
    const { visualizer } = await import('rollup-plugin-visualizer');
    const visualizerOptions = visualize === true ? {} : visualize;
    allPlugins.push(visualizer(visualizerOptions) as PluginOption);
  }

  const base: UserConfig = {
    plugins: allPlugins,
    build: {
      target,
      sourcemap,
    },
  };

  if (lib) {
    const external = lib.external ?? ['react', 'react-dom'];

    base.build = {
      ...base.build,
      lib: {
        entry: lib.entry,
        formats: lib.formats ?? ['es', 'cjs'],
        name: lib.name,
        fileName: (format, entryName) => `${entryName}.${format}.js`,
      },
      rolldownOptions: {
        external: toExternal(external),
      },
    };
  }

  return defineConfig(mergeConfig(base, override));
}

export default createViteConfig;
export { createViteConfig };

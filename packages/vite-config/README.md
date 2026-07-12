# @chanom/vite-config

Opinionated Vite and Vitest config factories for libraries and React apps.

`createViteConfig` applies build defaults (target, sourcemaps, optional library mode and bundle visualization), then deep-merges your overrides on top via Vite's `mergeConfig`. Use it in Vite project (so you don't have to install Vite yourself).

For tests, `createVitestConfig` (and its React presets) applies the same pattern to Vitest — see [Vitest config](#vitest-config).

## Install

```sh
pnpm add -D @chanom/vite-config
```

If you want to use the bundle visualizer, also install its optional peer:

```sh
pnpm add -D rollup-plugin-visualizer
```

## Usage

### React app

```sh
pnpm add -D @vitejs/plugin-react
```

`vite.config.ts`:

```ts
import { createViteConfig } from '@chanom/vite-config';
import react from '@vitejs/plugin-react';

export default createViteConfig({ plugins: [react()] });
```

`createViteConfig` returns a `Promise` because the visualizer plugin is loaded lazily; Vite supports an async default export from the config file.

### Library

```sh
pnpm add -D vite-plugin-dts
```

`vite.config.ts`:

```ts
import { createViteConfig } from '@chanom/vite-config';
import dts from 'vite-plugin-dts';

export default createViteConfig(
  { lib: { entry: 'src/index.ts' }, plugins: [dts()], visualize: true },
  { build: { minify: false } },
);
```

## API

```ts
createViteConfig(options?, override?): Promise<UserConfig>
```

### `options`

| Field       | Type                           | Default                           | Notes                                                                         |
| ----------- | ------------------------------ | --------------------------------- | ----------------------------------------------------------------------------- |
| `target`    | `string \| string[]`           | `"esnext"`                        | Build target                                                                  |
| `sourcemap` | `boolean`                      | `true` for libs, `false` for apps | App source isn't shipped publicly unless set                                  |
| `plugins`   | `PluginOption[]`               | `[]`                              | Framework plugins live here, keeping this package free of framework peer deps |
| `lib`       | `LibOptions`                   | -                                 | When set, enables Vite library mode                                           |
| `visualize` | `boolean \| VisualizerOptions` | -                                 | Emit a bundle treemap                                                         |

### `options.lib`

| Field      | Type                                           | Default                  | Notes                                                                                         |
| ---------- | ---------------------------------------------- | ------------------------ | --------------------------------------------------------------------------------------------- |
| `entry`    | `string \| string[] \| Record<string, string>` | -                        | Library entry point(s)                                                                        |
| `formats`  | `('es' \| 'cjs' \| 'umd' \| 'iife')[]`         | `['es', 'cjs']`          | Output formats                                                                                |
| `name`     | `string`                                       | -                        | Global name, required for `umd`/`iife`                                                        |
| `external` | `string[]`                                     | `['react', 'react-dom']` | Kept external; matches exactly or as a prefix (`react` also externalizes `react/jsx-runtime`) |

### `options.visualize`

Pass `true` for defaults or a subset of [`rollup-plugin-visualizer`](https://github.com/btd/rollup-plugin-visualizer) options:

| Option       | Type                                                               | Default      |
| ------------ | ------------------------------------------------------------------ | ------------ |
| `filename`   | `string`                                                           | `stats.html` |
| `template`   | `treemap \| sunburst \| network \| list \| raw-data \| flamegraph` | `treemap`    |
| `open`       | `boolean`                                                          | `false`      |
| `gzipSize`   | `boolean`                                                          | `false`      |
| `brotliSize` | `boolean`                                                          | `false`      |

### `override`

A standard Vite `UserConfig` that is deep-merged over the generated config. Use it to override any default.

## Defaults summary

- Build target: `esnext`
- Sourcemaps: on for libraries, off for apps
- Library output formats: `es` and `cjs`
- Library externals: `react`, `react-dom` (and any subpath like `react/jsx-runtime`)

## Vitest config

Three factories build Vitest configs the same way `createViteConfig` builds Vite configs: opinionated defaults, then your `override` deep-merged on top via `mergeConfig`.

- `createVitestConfig` – base config: Node environment, no test globals.
- `createReactLibraryVitestConfig` – base + `jsdom` environment and global test APIs, for testing components in isolation.
- `createReactAppVitestConfig` – like the library preset, but also processes CSS during tests (`css: true`) since app components commonly import stylesheets and CSS modules.

These live behind the `@chanom/vite-config/vitest` subpath so importing `createViteConfig` never pulls in `vitest/config`. `vitest` is an optional peer dependency — install it in your project when you use this subpath:

```sh
pnpm add -D vitest
```

Like `createViteConfig`, framework plugins are passed in through `plugins`, so this package stays free of framework peer deps. Install what a given preset needs in your consuming project:

- React presets: `jsdom` (the environment) and `@vitejs/plugin-react`.
- Coverage: `@vitest/coverage-v8` (only when you enable `coverage`).

### Base

`vitest.config.ts`:

```ts
import { createVitestConfig } from '@chanom/vite-config/vitest';

export default createVitestConfig({ coverage: true });
```

### React library

```sh
pnpm add -D jsdom @vitejs/plugin-react
```

`vitest.config.ts`:

```ts
import { createReactLibraryVitestConfig } from '@chanom/vite-config/vitest';
import react from '@vitejs/plugin-react';

export default createReactLibraryVitestConfig({
  plugins: [react()],
  setupFiles: ['./test/setup.ts'],
});
```

### React app

```ts
import { createReactAppVitestConfig } from '@chanom/vite-config/vitest';
import react from '@vitejs/plugin-react';

export default createReactAppVitestConfig({
  plugins: [react()],
  setupFiles: ['./test/setup.ts'],
});
```

### API

```ts
createVitestConfig(options?, override?): ViteUserConfig
createReactLibraryVitestConfig(options?, override?): ViteUserConfig
createReactAppVitestConfig(options?, override?): ViteUserConfig
```

#### `options`

| Field         | Type                         | Base default                               | Notes                                                                         |
| ------------- | ---------------------------- | ------------------------------------------ | ----------------------------------------------------------------------------- |
| `environment` | `string`                     | `"node"` (`"jsdom"` in React presets)      | Test environment                                                              |
| `include`     | `string[]`                   | `["{src,test}/**/*.{test,spec}.{ts,tsx}"]` | Test file globs (colocated and separate dirs)                                 |
| `globals`     | `boolean`                    | `false` (`true` in React presets)          | Register `describe`/`it`/`expect` globally                                    |
| `setupFiles`  | `string \| string[]`         | -                                          | Files run once before each test file                                          |
| `css`         | `boolean`                    | off (`true` in the app preset)             | Process CSS during tests                                                      |
| `plugins`     | `PluginOption[]`             | `[]`                                       | Framework plugins live here, keeping this package free of framework peer deps |
| `coverage`    | `boolean \| CoverageOptions` | off                                        | `true` for v8 defaults, an object to tweak them. Needs `@vitest/coverage-v8`  |

#### `options.coverage`

| Field        | Type                                             | Default                    |
| ------------ | ------------------------------------------------ | -------------------------- |
| `provider`   | `"v8" \| "istanbul"`                             | `"v8"`                     |
| `include`    | `string[]`                                       | `["src/**/*.{ts,tsx}"]`    |
| `exclude`    | `string[]`                                       | -                          |
| `reporter`   | `string[]`                                       | `["text", "html", "lcov"]` |
| `thresholds` | `{ statements?, branches?, functions?, lines? }` | -                          |

#### `override`

A standard Vitest config (`ViteUserConfig`) deep-merged over the generated config, so the caller always wins. Use it for anything not surfaced in `options`.

## Build this package

```sh
pnpm build   # tsdown -> dist/ (ESM + .d.ts)
pnpm dev     # watch mode
```

## Troubleshooting

- **`Cannot find module 'rollup-plugin-visualizer'`** when using `visualize` – install it in your consuming project. It is an optional peer dependency.
- **Overrides not taking effect** – make sure you pass them as the second argument, not inside `options`.

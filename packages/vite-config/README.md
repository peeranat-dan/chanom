# @chanom/vite-config

Opinionated Vite config factory for libraries and React apps.

`createViteConfig` applies build defaults (target, sourcemaps, optional library mode and bundle visualization), then deep-merges your overrides on top via Vite's `mergeConfig`. Use it in Vite project (so you don't have to install Vite yourself).

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

## Build this package

```sh
pnpm build   # tsdown -> dist/ (ESM + .d.ts)
pnpm dev     # watch mode
```

## Troubleshooting

- **`Cannot find module 'rollup-plugin-visualizer'`** when using `visualize` – install it in your consuming project. It is an optional peer dependency.
- **Overrides not taking effect** – make sure you pass them as the second argument, not inside `options`.

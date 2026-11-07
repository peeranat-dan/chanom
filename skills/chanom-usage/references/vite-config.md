# @chanom/vite-config

Vite and Vitest config factories: chanom defaults first, your overrides
deep-merged on top (second argument). Framework plugins are passed in, so
install them yourself.

## Wire

React app - install `@chanom/vite-config @vitejs/plugin-react` as dev deps.

`vite.config.ts`:

```ts
import { createViteConfig } from '@chanom/vite-config';
import react from '@vitejs/plugin-react';

export default createViteConfig({ plugins: [react()] });
```

`vitest.config.ts` - also install `vitest jsdom` (and `@vitest/coverage-v8`
when coverage is on):

```ts
import { createReactAppVitestConfig } from '@chanom/vite-config/vitest';
import react from '@vitejs/plugin-react';

export default createReactAppVitestConfig({
  plugins: [react()],
  setupFiles: ['./src/test-setup.ts'],
});
```

## Variants

| Project          | Vite                                                                              | Vitest                           |
| ---------------- | --------------------------------------------------------------------------------- | -------------------------------- |
| React app        | `createViteConfig({ plugins: [react()] })`                                        | `createReactAppVitestConfig`     |
| React library    | `createViteConfig({ lib: { entry: 'src/index.ts' }, plugins: [react(), dts()] })` | `createReactLibraryVitestConfig` |
| Non-React / Node | `createViteConfig({ lib: { entry } })`                                            | `createVitestConfig`             |

- Library mode needs `vite-plugin-dts` for types; `react`/`react-dom` stay
  external by default.
- `visualize: true` needs `rollup-plugin-visualizer` installed.
- Migrating an existing config: move plugins into `options.plugins` and every
  other setting into the second (`override`) argument.

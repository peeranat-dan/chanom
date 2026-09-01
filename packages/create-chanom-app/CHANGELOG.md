# create-chanom-app

## 0.2.0

### Minor Changes

- c6146e3: Add VS Code editor config to generated and brewed projects.

  `create-chanom-app` now writes `.vscode/settings.json` and
  `.vscode/extensions.json` into every scaffolded app, and `chanom brew` gains a
  `vscode` topping that does the same for an existing project. The settings route
  formatting and lint fixes through the oxc extension on save and recommend it, so
  a fresh clone is set up without any manual editor configuration.

  In `brew`, both files are merged rather than overwritten: settings you already
  have win (and are reported), existing extension recommendations are kept, and a
  `.vscode` file that isn't parseable JSON is left untouched with a warning.

## 0.1.0

### Minor Changes

- 999ea88: Add `create-chanom-app`, a standalone scaffolder for Vite + React + TypeScript apps wired to the chanom shared configs. Ships a minimal-but-wired baseline (oxlint, oxfmt, Vitest + Testing Library, a local tsconfig) with every dependency pinned exact from the workspace catalog, plus an optional `commit-hooks` topping (husky + lint-staged + commitlint). Run it with `pnpm create chanom-app`, `npm create chanom-app`, or `yarn create chanom-app`.

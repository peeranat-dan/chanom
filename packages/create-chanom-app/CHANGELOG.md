# create-chanom-app

## 0.5.0

### Minor Changes

- e92aa3c: Add a `github-actions` topping that writes `.github/workflows/ci.yml` with your choice of `lint`, `build`, `typecheck`, and `test` jobs. In `chanom brew` it is a topping option; in `create-chanom-app` it is a prompt plus the `--github-actions` / `--no-github-actions` / `--ci-jobs` flags.

## 0.4.3

### Patch Changes

- ceca10f: Bump `vitest` and `@vitest/coverage-v8` to 5.0.5, `@effect/vitest` to 0.30.1, and `effect` to 3.22.4.

## 0.4.2

### Patch Changes

- bed45ec: Generated apps now pin `typescript` to 7.0.2.
- bed45ec: Bump `oxlint` to 1.89.0, `oxfmt` to 0.74.0, and `oxlint-tsgolint` to 7.0.2005.

## 0.4.1

### Patch Changes

- b1bf6cd: Fix spinner flickering during dependency installation by capturing package manager output instead of streaming it. Output is shown when the install fails.

## 0.4.0

### Minor Changes

- 2574915: add typecheck script to baseline contribution

## 0.3.0

### Minor Changes

- ead78c5: Add an installable `coding-standards` agent skill, via a new `agent-skills` topping in `create-chanom-app` (`--agent-skills` / `--no-agent-skills`) and a `skills` topping in `chanom brew`. The skill targets the stack chanom scaffolds: a router `SKILL.md` plus TypeScript, React, and Vitest references. Files land in `.agents/skills/` so any agent tool can read them, with `.claude/skills/coding-standards` a relative symlink pointing at them. Existing files and links are reported and left untouched, so re-running never overwrites standards you have edited.

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

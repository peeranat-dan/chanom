# @chanom/cli

## 0.2.2

### Patch Changes

- 36d3c50: fix: add oxlint-tsgolint to support type aware linting

## 0.2.1

### Patch Changes

- 8ac5653: fix: ensure devDependencies are preserved after package installation
- 95caa71: Fix `brew` husky setup in pnpm workspaces: detect parent git repositories with
  `git rev-parse` instead of a `.git` folder check (no more nested `git init` in
  workspace packages), fail early with a clear error when medium sweetness is
  brewed away from the repository root, and skip lint-staged (removing husky's
  seeded `npm test` pre-commit hook) when no linter or formatter topping is
  selected so commits aren't blocked by an empty config.

## 0.2.0

### Minor Changes

- a5d89f4: Detect workspace roots when installing packages. When `brew` runs at the root of a monorepo (a `pnpm-workspace.yaml` or a `workspaces` field in `package.json`), the install command now gets the flag that package manager requires: `-w` for pnpm, `-W` for yarn classic, and none for npm, bun, and yarn berry, which install to the root as-is.

## 0.1.1

### Patch Changes

- 7b2c73d: add node_modules to .gitignore automatically during brew, appending it if the file already exists

## 0.1.0

### Minor Changes

- 097de84: add debug flag to chanom cli

### Patch Changes

- 097de84: show invalid package error in cli when processing malformed package.json

## 0.0.4

### Patch Changes

- 565d891: `chanom brew` now reinstalls `oxlint`, `oxfmt`, and `@chanom/dev-config` whenever the installed version doesn't match the CLI's pinned version, instead of skipping installation entirely once the package was present at any version.

## 0.0.3

### Patch Changes

- improve cli implementation

## 0.0.2

### Patch Changes

- - remove eslint and prettier
  - add knip config

## 0.0.1

### Patch Changes

- add initial chanom cli

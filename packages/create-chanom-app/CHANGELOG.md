# create-chanom-app

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

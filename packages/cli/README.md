# @chanom/cli

Interactive CLI that brews dev tooling config into your project - oxlint, oxfmt, knip, and commit hooks, picked with a couple of prompts.

## Install

Run it directly, no install needed:

```sh
npx @chanom/cli brew
# or
pnpm dlx @chanom/cli brew
```

or if you want to install it within your project:

```sh
pnpm add -D @chanom/cli
```

## Usage

```sh
chanom brew
```

Add `--debug` to trace what the CLI is doing and see exactly where it failed:

```sh
chanom brew --debug
```

Debug mode logs each step (detected package manager, planned packages, every command it spawns and its exit code) to stderr, and on failure prints the full error trace including which step failed.

`brew` walks you through two prompts:

1. **Toppings** - which tools to add, any combination (or none):
   - `oxlint` - fast Rust-based linter
   - `oxfmt` - fast Rust-based formatter
   - `knip` - dead code remover
2. **Sweetness** - how strict to be:
   - `light` - warn only, no blocking
   - `medium` - block on commit via husky + lint-staged + commitlint

Based on your answers, `brew` will:

- Initialize a git repo if one doesn't exist yet (with a `.gitignore`)
- Detect your package manager (`pnpm`, `npm`, `yarn`, or `bun`) - the `packageManager` field in `package.json` wins over the invoking user agent, falling back to `pnpm`
- Install the packages needed for your selected toppings as dev dependencies
- Write config files and wire up `package.json` scripts
- If `medium` sweetness is selected, run `husky init` and add `pre-commit` / `commit-msg` hooks
- Stage and commit the changes it made

Cancelling a prompt (Ctrl+C) exits cleanly without touching anything further.

## What gets added

| Topping  | Config file          | Scripts added            |
| -------- | -------------------- | ------------------------ |
| `oxlint` | `oxlint.config.ts`\* | `lint`, `lint:fix`       |
| `oxfmt`  | `oxfmt.config.ts`\*  | `format`, `format:check` |
| `knip`   | `knip.config.ts`\*   | `knip`                   |

\* `.mts` instead of `.ts` when your project is CommonJS (no `"type": "module"` in `package.json`).

Config files re-export presets from [`@chanom/dev-config`](../dev-config).

`medium` sweetness additionally adds:

- `husky` - installed via `husky init`
- `lint-staged` - `.lintstagedrc.json` running the selected linter/formatter on staged files, wired into the `pre-commit` hook
- `commitlint` - `.commitlintrc.json` extending `@commitlint/config-conventional`, enforced in the `commit-msg` hook

## Version pinning

The CLI bundles the tool versions its generated configs are known to work with (baked in at build time). `oxlint`, `oxfmt`, and `@chanom/dev-config` are (re)installed whenever the installed version doesn't match the pinned one exactly - in either direction, since the generated config must match. `knip`, `husky`, `lint-staged`, and the commitlint packages are only installed when missing.

## Safety

Existing setup is never overwritten:

- If a config file for a tool already exists (any common variant, e.g. `.oxlintrc.json` or `oxlint.config.mjs`), `brew` warns and skips writing it.
- If a script name already exists in `package.json`, `brew` warns and leaves it alone.
- Existing `.husky/pre-commit` and `.husky/commit-msg` hooks are kept.

The final commit uses your git identity; if none is configured, a local `Chanom <chanom@local>` identity is set. If committing fails (e.g. a commit hook rejects it), your files stay staged and `brew` tells you to commit manually.

## Development

See [ARCHITECTURE.md](./ARCHITECTURE.md) for how the code is organized.

```sh
pnpm build      # bundle with tsdown
pnpm test       # run vitest once
pnpm test:watch # run vitest in watch mode
```

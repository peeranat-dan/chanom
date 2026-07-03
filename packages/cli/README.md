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

`brew` walks you through two prompts:

1. **Toppings** - which tools to add, any combination of:
   - `oxlint` - fast Rust-based linter
   - `oxfmt` - fast Rust-based formatter
   - `knip` - dead code remover
2. **Sweetness** - how strict to be:
   - `light` - warn only, no blocking
   - `medium` - block on commit via husky + lint-staged + commitlint

Based on your answers, `brew` will:

- Initialize a git repo if one doesn't exist yet (with a `.gitignore`)
- Detect your package manager (`pnpm`, `npm`, `yarn`, or `bun`) from `package.json`/`packageManager` or the invoking user agent
- Install the packages needed for your selected toppings, upgrading `oxlint`, `oxfmt`, and `@chanom/dev-config` to the expected version if an older one is already installed
- Write config files (`oxlint.config.ts`, `oxfmt.config.ts`, `knip.config.ts`, `.commitlintrc.json`, `.lintstagedrc.json`) and wire up `package.json` scripts
- If `medium` sweetness is selected, run `husky init` and add `pre-commit` / `commit-msg` hooks
- Stage and commit the changes it made

## What gets added

| Topping  | Config file        | Scripts added            |
| -------- | ------------------ | ------------------------ |
| `oxlint` | `oxlint.config.ts` | `lint`, `lint:fix`       |
| `oxfmt`  | `oxfmt.config.ts`  | `format`, `format:check` |
| `knip`   | `knip.config.ts`   | `knip`                   |

Config files re-export presets from [`@chanom/dev-config`](../dev-config).

`medium` sweetness additionally adds:

- `husky` - installed via `husky init`
- `lint-staged` - `.lintstagedrc.json` running the selected linter/formatter on staged files
- `commitlint` - `.commitlintrc.json` extending `@commitlint/config-conventional`, enforced in the `commit-msg` hook

Existing scripts and config are never overwritten - if a script name already exists in `package.json`, `brew` logs a warning and leaves it alone.

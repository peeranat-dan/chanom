# create-chanom-app

Scaffold a Vite + React + TypeScript app, wired to the [chanom](https://github.com/peeranat-dan/chanom) shared configs, with a couple of prompts.

## Usage

Run it directly, no install needed:

```sh
npm create chanom-app@latest
# or
pnpm create chanom-app
```

Pass a directory to skip the name prompt:

```sh
pnpm create chanom-app my-app
```

Scaffold into the current directory with `.`:

```sh
pnpm create chanom-app .
```

## Prompts

Run with no flags, the CLI walks you through:

1. **Project name** - the target directory (kebab-cased). Defaults to `my-chanom-app`.
2. **Initialize a git repository?** - `git init` plus an initial commit.
3. **Add commit hooks?** - husky + lint-staged + commitlint (only asked when git is enabled).
4. **Install dependencies now?** - runs `<pm> install` after scaffolding.

Every prompt has a matching flag so you can pre-answer any of them (or all, with `--yes`).

## Options

| Flag                          | What it does                                              |
| ----------------------------- | --------------------------------------------------------- |
| `[directory]`                 | Target directory / project name (prompted if omitted)     |
| `--git` / `--no-git`          | Initialize a git repository (default: yes)                |
| `--commit-hooks`              | Add husky + lint-staged + commitlint (requires git)       |
| `--no-commit-hooks`           | Skip the commit-hooks topping                             |
| `--install` / `--no-install`  | Install dependencies after scaffolding (default: install) |
| `--pm <pnpm\|npm\|yarn\|bun>` | Package manager to record (default: detected)             |
| `-y`, `--yes`                 | Accept all defaults, no prompts (CI-friendly)             |
| `--help`                      | Show help                                                 |
| `--version`                   | Show the version                                          |

`--no-git --commit-hooks` is rejected: husky needs a repo to install into.

The package manager is detected from the invoking user agent (falling back to `pnpm`); `--pm` overrides it and is recorded in the generated `package.json` `packageManager` field.

### Non-interactive

```sh
pnpm create chanom-app my-app --yes --no-install
```

`--yes` accepts every default without prompting, so scaffolding runs unattended in CI.

## What gets generated

A minimal Vite + React + TS app wired to the chanom shared configs:

- `package.json` - dependencies pinned to the versions the scaffolder bundles, plus `dev` / `build` / `preview` / `lint` / `format` / `format:check` / `test` / `test:watch` scripts
- `vite.config.ts` - using `@vitejs/plugin-react` and [`@chanom/vite-config`](../vite-config)
- `tsconfig.json` - extending `@tsconfig/vite-react`
- `oxlint.config.ts` / `oxfmt.config.ts` - re-exporting the [`@chanom/dev-config`](../dev-config) presets
- `vitest.config.ts` and a sample `src/app.test.tsx`
- `src/` - `main.tsx`, `app.tsx`, `index.css`, and type declarations
- `index.html`, `.gitignore`, and a starter `README.md`

With the **commit-hooks** topping, it also adds husky, lint-staged, and commitlint as dev dependencies plus their config files (`.husky/pre-commit`, `.husky/commit-msg`, `.lintstagedrc.json`, `.commitlintrc.json`). The hooks materialize on the first install via the generated `prepare: "husky"` script.

## Development

```sh
pnpm build      # bundle with tsdown (copies templates/ into dist/)
pnpm test       # run vitest once
pnpm test:watch # run vitest in watch mode
```

Most files in `templates/` are copied byte-for-byte into every generated app. The README, `src/app.tsx`, and `src/app.test.tsx` have their app-name placeholders replaced; files whose contents are fully computed (`package.json`, `vite.config.ts`, `tsconfig.json`, `index.html`) are rendered by the generators in `src/generate/`.

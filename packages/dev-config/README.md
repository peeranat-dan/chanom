# @chanom/dev-config

Shared [oxlint](https://oxc.rs/docs/guide/usage/linter) and [oxfmt](https://oxc.rs/docs/guide/usage/formatter) config.

Two layers per tool:

- **base** - TypeScript-only rules, framework-agnostic. Use for libraries and Node packages.
- **config** - base plus React + jsx-a11y rules. Use for React apps.

## Install

```sh
pnpm add -D @chanom/dev-config oxlint oxfmt
```

`oxlint` and `oxfmt` are peer dependencies, so install them in the consuming project too.

## Exports

| Specifier                          | Contents                |
| ---------------------------------- | ----------------------- |
| `@chanom/dev-config/oxlint/base`   | TypeScript lint rules   |
| `@chanom/dev-config/oxlint/config` | base + React + jsx-a11y |
| `@chanom/dev-config/oxfmt/base`    | oxfmt rules             |
| `@chanom/dev-config/oxfmt/config`  | alias of `oxfmt/base`   |

## Usage

### React app

`oxlint.config.ts`:

```ts
import oxlintConfig from '@chanom/dev-config/oxlint/config';

export default oxlintConfig;
```

`oxfmt.config.ts`:

```ts
import oxfmtConfig from '@chanom/dev-config/oxfmt/config';

export default oxfmtConfig;
```

### Library or Node package

`oxlint.config.ts`:

```ts
import oxlintConfig from '@chanom/dev-config/oxlint/base';

export default oxlintConfig;
```

### Extending the base config

```ts
import baseConfig from '@chanom/dev-config/oxlint/base';
import { defineConfig } from 'oxlint';

export default defineConfig({
  extends: [baseConfig],
  plugins: ['typescript', 'unicorn', 'oxc'],
  rules: {
    'no-console': 'off',
  },
});
```

## Inspecting the config

There are three ways to see exactly what a shared config sets, without reading
this package's source.

### Print it

The package ships a `chanom-dev-config` bin that prints any export as JSON:

```sh
pnpm exec chanom-dev-config print oxlint/config
pnpm exec chanom-dev-config print oxfmt/base
pnpm exec chanom-dev-config list   # every config name
```

The name matches the export specifier without the `@chanom/dev-config/` prefix.
Redirect the output to a file to diff configs between versions:

```sh
pnpm exec chanom-dev-config print oxlint/config > oxlint.resolved.json
```

For oxlint you can also ask oxlint for the fully merged result of your own
`oxlint.config.ts`, including anything you added on top:

```sh
pnpm exec oxlint --print-config
```

### Hover it

Every export is typed with its literal values, so hovering the import (or
"Go to Definition") in your editor shows the actual settings, for example
`tabWidth: 2` and the full `ignorePatterns` list, rather than just `number` or
`string[]`.

### Read it

`dist/` mirrors `src/` file for file, so
`node_modules/@chanom/dev-config/dist/oxlint/base-config.js` holds the base lint
config as plain JavaScript.

## Ignored paths

The lint configs ignore the usual build artifacts by default:

- `**/node_modules/**`
- `**/.turbo/**`
- `**/dist/**`
- `**/build/**`
- `**/storybook-static/**`
- `**/env.d.ts` (config only)

Add project-specific ignores in your local `oxlint.config.ts` if needed.

## What you get

### oxlint base

- `correctness` rules are errors
- `no-explicit-any` as error
- `no-console` as error
- `no-unused-vars` as error, ignoring `_`-prefixed names
- `typescript/consistent-type-definitions` as error
- `typescript/consistent-type-imports` as error
- `typescript/no-deprecated` as warning

### oxlint config (React)

Everything in **base**, plus:

- `react` and `jsx-a11y` plugins
- `react/rules-of-hooks` as error
- `react-hooks/exhaustive-deps` as warning
- `no-restricted-imports` blocks default imports of `react` and `zod`

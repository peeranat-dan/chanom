# @chanom/tsconfig

Shared TypeScript configuration presets for chanom packages.

Each preset layers the org-wide options in `base.json` on top of the relevant
[`@tsconfig`](https://github.com/tsconfig/bases) community base, so packages
extend a single named preset instead of wiring the base chain themselves.

## Presets

| Preset                              | Extend from                                       | Use for                                                            |
| ----------------------------------- | ------------------------------------------------- | ------------------------------------------------------------------ |
| `@chanom/tsconfig/base.json`        | —                                                 | Org-wide compiler options only; composed by the presets below.     |
| `@chanom/tsconfig/node-lts.json`    | `@tsconfig/node-lts` + base                       | Packages compiled ahead of time (e.g. bundled with tsdown).        |
| `@chanom/tsconfig/node-ts.json`     | `@tsconfig/node-ts` + base                        | Packages executed as TypeScript directly (type stripping).         |
| `@chanom/tsconfig/node-lts-ts.json` | `@tsconfig/node-lts` + `@tsconfig/node-ts` + base | Packages that are both run as TypeScript and compiled for release. |

## Usage

Add the package as a dev dependency:

```jsonc
// package.json
{
  "devDependencies": {
    "@chanom/tsconfig": "workspace:*",
  },
}
```

Then extend the preset that matches how the package is consumed:

```jsonc
// tsconfig.json
{
  "extends": "@chanom/tsconfig/node-lts.json",
}
```

Package-specific compiler options (extra `types`, language-service plugins,
etc.) go in the local `compilerOptions` and win over the preset.

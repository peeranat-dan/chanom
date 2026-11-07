# Dev tooling: `chanom brew`

`@chanom/cli` adds lint, format, editor, CI, and commit-hook setup to an
existing project. It installs `@chanom/dev-config` (shared oxlint/oxfmt
presets) for you, so install neither by hand.

## Wire

`brew` is interactive (two or three prompts), so ask the user to run it in
their terminal rather than running it yourself:

```sh
npx @chanom/cli brew   # or: pnpm dlx @chanom/cli brew
```

Tell them which answers fit the needs you matched:

| Need                                               | Topping / answer                         |
| -------------------------------------------------- | ---------------------------------------- |
| Lint                                               | `oxlint`                                 |
| Format                                             | `oxfmt`                                  |
| Dead code / unused deps                            | `knip`                                   |
| Format and fix on save in VS Code                  | `vscode`                                 |
| Coding standards for AI agents                     | `skills`                                 |
| CI on pull requests                                | `github-actions`, then pick jobs         |
| Block bad commits (husky, lint-staged, commitlint) | Sweetness `medium` (run at the git root) |
| Warnings only                                      | Sweetness `light`                        |

`brew` never overwrites existing configs or scripts, and commits its changes at
the end. After it finishes, run the new `lint` and `format` scripts and fix
what they report.

## Without the CLI

When the user wants only the shared presets, install
`@chanom/dev-config oxlint oxfmt` as dev deps and re-export:

```ts
// oxlint.config.ts - use `oxlint/base` for a non-React library
export { default } from '@chanom/dev-config/oxlint/config';
```

```ts
// oxfmt.config.ts
export { default } from '@chanom/dev-config/oxfmt/config';
```

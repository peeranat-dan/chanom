# New app: `create-chanom-app`

Scaffolds Vite + React + TypeScript already wired to `@chanom/vite-config`,
`@chanom/dev-config`, Vitest, and VS Code settings.

## Wire

Run non-interactively with flags matched to the needs you heard:

```sh
pnpm create chanom-app <dir> --yes
```

| Need                                          | Flag                          |
| --------------------------------------------- | ----------------------------- |
| No git repo                                   | `--no-git`                    |
| Commit hooks (husky, lint-staged, commitlint) | `--commit-hooks` (needs git)  |
| No agent coding standards                     | `--no-agent-skills`           |
| CI limited to some jobs                       | `--ci-jobs lint,test`         |
| No CI                                         | `--no-github-actions`         |
| Specific package manager                      | `--pm <pnpm\|npm\|yarn\|bun>` |
| Skip install                                  | `--no-install`                |

With `npm`, pass flags after `--`: `npm create chanom-app@latest <dir> -- --yes`.

Then `cd <dir>` and return to step 2 of the skill for runtime packages
(analytics, logger, utils). Do not run `chanom brew` on a scaffolded app - it
already has everything brew adds.

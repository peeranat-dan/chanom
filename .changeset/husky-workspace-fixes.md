---
'@chanom/cli': patch
---

Fix `brew` husky setup in pnpm workspaces: detect parent git repositories with
`git rev-parse` instead of a `.git` folder check (no more nested `git init` in
workspace packages), fail early with a clear error when medium sweetness is
brewed away from the repository root, and skip lint-staged (removing husky's
seeded `npm test` pre-commit hook) when no linter or formatter topping is
selected so commits aren't blocked by an empty config.

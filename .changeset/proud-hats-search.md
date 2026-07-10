---
'@chanom/cli': minor
---

Detect workspace roots when installing packages. When `brew` runs at the root of a monorepo (a `pnpm-workspace.yaml` or a `workspaces` field in `package.json`), the install command now gets the flag that package manager requires: `-w` for pnpm, `-W` for yarn classic, and none for npm, bun, and yarn berry, which install to the root as-is.

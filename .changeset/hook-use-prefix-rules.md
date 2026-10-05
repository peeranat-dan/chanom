---
'@chanom/dev-config': minor
---

Add `chanom` oxlint JS plugin with `hook-filename` and `hook-name` rules that require the `use` prefix for files and exported functions under a `hooks` folder. Expose it as `@chanom/dev-config/oxlint/plugin`, and expose the React config as `@chanom/dev-config/oxlint/react` (with both rules enabled). `oxlint/config` remains an alias of the React config.

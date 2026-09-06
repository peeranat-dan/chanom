---
'@chanom/cli': patch
---

Pass `-c <config>` to the generated `oxlint`/`oxfmt` scripts and lint-staged commands when the config file is one the tools do not auto-discover (`.mts` or `.cts`). Previously a CommonJS project got an `.mts` config that was silently ignored. The flag tracks whichever config actually ends up on disk, so an existing config that `brew` detects and skips is named correctly too.

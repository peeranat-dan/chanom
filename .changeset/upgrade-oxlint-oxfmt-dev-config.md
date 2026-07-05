---
'@chanom/cli': patch
---

`chanom brew` now reinstalls `oxlint`, `oxfmt`, and `@chanom/dev-config` whenever the installed version doesn't match the CLI's pinned version, instead of skipping installation entirely once the package was present at any version.

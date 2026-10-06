---
'@chanom/dev-config': patch
---

Republish with peer dependencies matching the workspace catalog (`oxfmt@0.58.0`, `oxlint@1.73.0`). The published `0.0.3` declared `oxfmt@0.56.0` as a peer, so installing it next to `oxfmt@0.58.0` failed with `ERESOLVE`.

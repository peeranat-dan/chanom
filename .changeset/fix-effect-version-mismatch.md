---
'create-chanom-app': patch
'@chanom/cli': patch
---

Bump `effect` and `@effect/platform-node` to 4.1.5 so fresh installs no longer resolve `@effect/platform-node-shared@4.1.5` against `effect@4.0.6`, which crashed on startup with `ERR_MODULE_NOT_FOUND` for `effect/dist/process/CommandLine.js`.

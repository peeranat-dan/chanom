---
'@chanom/env': minor
---

Split `createEnv` schemas into `server` and `client`, for Node servers (Firebase Functions, SSR) as well as Vite apps. On the client only `client` is validated, and reading a `server` variable throws. `envPlugin` now takes `client` instead of `schema`.

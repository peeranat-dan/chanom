---
'create-chanom-app': minor
---

Generated apps now extend `@chanom/tsconfig/vite-react.json` instead of `@tsconfig/vite-react`, and add `@chanom/tsconfig` as a dev dependency in its place. The shared preset adds `strict` and `noImplicitOverride` on top of the previous options.

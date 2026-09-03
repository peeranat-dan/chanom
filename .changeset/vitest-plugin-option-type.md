---
'@chanom/vite-config': patch
---

Fix a type mismatch in `CreateVitestConfigOptions.plugins`. The option was typed
as `PluginOption[]` imported from `vite`, but Vitest resolves its own copy of
Vite, so plugins created against that copy were not assignable and consumers hit
errors when passing framework plugins such as `@vitejs/plugin-react`. The option
is now typed as `VitestPluginOption[]`, derived from `ViteUserConfig['plugins']`
in `vitest/config`, so it always matches the config Vitest actually consumes.

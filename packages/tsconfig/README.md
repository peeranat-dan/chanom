# @chanom/tsconfig

Shared TypeScript configs for chanom apps.

## Install

```sh
pnpm add -D @chanom/tsconfig typescript
```

Requires TypeScript 5.8 or later: the presets use `erasableSyntaxOnly` (5.8) and `${configDir}` (5.5).

## Usage

### Vite + React app

`tsconfig.json`:

```json
{
  "extends": "@chanom/tsconfig/vite-react.json",
  "include": ["src"]
}
```

Add more ambient types by overriding `types`. It replaces the preset's list, so keep `vite/client`:

```json
{
  "extends": "@chanom/tsconfig/vite-react.json",
  "compilerOptions": {
    "types": ["vite/client", "vitest/globals"]
  },
  "include": ["src"]
}
```

### Other projects

Extend `@chanom/tsconfig/base.json` and set `target`, `module`, `moduleResolution`, and `lib` yourself.

## Presets

| Preset            | What it sets                                                                                                            |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `base.json`       | `strict`, `verbatimModuleSyntax`, `erasableSyntaxOnly`, `noImplicitOverride`, unused-code and switch-fallthrough checks |
| `vite-react.json` | `base.json` plus ES2023 + DOM libs, bundler resolution, `noEmit`, `jsx: react-jsx`, and `vite/client` types             |

`vite-react.json` writes its build info to `node_modules/.tmp/tsconfig.app.tsbuildinfo` in your project, so `tsc -b` stays incremental without adding files to your source tree.

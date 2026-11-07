---
name: chanom-usage
description: Picks, installs, and wires the chanom (`@chanom/*`) packages into a frontend project. Use when starting a new Vite + React app, when a project needs analytics, logging, utils, lint/format, Vite/Vitest config, or CI/commit hooks, or when code imports `@chanom/*`.
---

# chanom-usage

Chanom is a set of small packages for Vite + React + TypeScript apps. Your job
is to **match each need** the project has to a package, install only those, and
wire each one in at a single module the rest of the app imports from.

## 1. Detect the project

- **No project yet** (empty dir, or the user asks for a new app): scaffold with
  `create-chanom-app` - see [`references/scaffold.md`](references/scaffold.md).
  It already brings `@chanom/vite-config` and `@chanom/dev-config`; continue to
  step 2 for runtime packages.
- **Existing project**: read `package.json`. Note the package manager
  (`packageManager` field, else the lockfile) and which `@chanom/*` packages are
  already installed. Use that package manager for every command below.

## 2. Match needs to packages

Read the user's request and the code for each need. One row per need; a project
usually hits several.

| Need (what you hear or see)                                                                                       | Package                       | Install as           | Reference                   |
| ----------------------------------------------------------------------------------------------------------------- | ----------------------------- | -------------------- | --------------------------- |
| Track events / page views, GA, GTM, PostHog, consent, `gtag(...)` or `posthog.capture` calls                      | `@chanom/analytics`           | dependency           | `references/analytics.md`   |
| Logging, debug output, `console.log` scattered around, Sentry breadcrumbs, quiet logs in prod                     | `@chanom/logger`              | dependency           | `references/logger.md`      |
| `cn`/class merging, debounce, throttle, retry, timeout, clipboard, storage, download, deep equal                  | `@chanom/utils`               | dependency           | `references/utils.md`       |
| Vite or Vitest config for an app or library, bundle visualizer, coverage                                          | `@chanom/vite-config`         | dev                  | `references/vite-config.md` |
| Lint and format (oxlint + oxfmt), VS Code format-on-save, knip, CI workflow, commit hooks, agent coding standards | `@chanom/cli` (`chanom brew`) | run with `npx`/`dlx` | `references/tooling.md`     |

Pick a package only when a need maps to it - leave the rest out. When a need is
ambiguous (e.g. "add tracking" with no vendor named), ask which provider before
installing.

## 3. Install and wire

For each picked package, in table order:

1. Install it with the project's package manager (`pnpm add`, `npm i`,
   `yarn add`, `bun add`; add `-D` for dev).
2. Read its reference and follow its **Wire** section.
3. Replace the hand-rolled code the need came from (raw `gtag(...)`,
   `console.log`, a local `debounce`) with the package's API.

Full API for any installed package: `node_modules/@chanom/<name>/README.md`.

## 4. Verify

Done when every picked package is installed, wired at its module, used at every
call site you found in step 2, and the project's `typecheck`, `lint`, `test`,
and `build` scripts (whichever exist) exit clean. Report to the user which
packages you added and the need each one covers.

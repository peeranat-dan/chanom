# `create-chanom-app` — v1 specification

> **Status:** locked for implementation. This document compiles every decision from [Map: create-chanom-app v1 spec (#36)](https://github.com/peeranat-dan/chanom/issues/36). Implementation happens off the map; this spec is the hand-off.
>
> Each section links back to the decision ticket that owns it. Where the ticket holds more detail (rejected alternatives, rationale), zoom the link.

---

## 1. Summary

`create-chanom-app` is a **standalone, published npm package** that scaffolds a new **Vite + React + TypeScript** app. Publishing it as `create-chanom-app` makes `pnpm create chanom-app`, `npm create chanom-app`, and `yarn create chanom-app` all work with no aliasing.

The generated app is a **minimal-but-wired baseline** plus **optional "toppings"** (brew metaphor), not a kitchen-sink template. It wires the app to `@chanom/vite-config` and `@chanom/dev-config` as dev tooling, but the generated app carries **no chanom runtime footprint** — it is a plain React app the moment it is written.

**Charter decisions** (locked while naming the destination, [#36](https://github.com/peeranat-dan/chanom/issues/36)):

- Standalone package, **not** a `chanom` subcommand.
- Baseline uses `@chanom/vite-config` (`createViteConfig`) and `@chanom/dev-config`.
- v1 template ships a **local** `tsconfig.json` (not `@chanom/tsconfig` — see §11 Out of scope).

**Stack conventions** (mirror `@chanom/cli`): Effect + `@clack/prompts` + picocolors; catalog deps under `catalogMode: strict`; changesets for release. All code follows `/coding-standards`.

---

## 2. Template mechanism

> Owns: [Choose the template mechanism (#37)](https://github.com/peeranat-dan/chanom/issues/37)

### 2.1 We own generation — no `create-vite` delegation

Rejected delegating to `create-vite`: it drifts with an independently-versioned upstream (defeating the pinned known-good baseline), and we'd immediately un-scaffold most of what it ships (its `vite.config.ts`, `tsconfig.json`, `eslint.config.js`, unpinned `package.json`). It is also a second network install and second prompt flow.

Accepted cost: we hand-maintain `index.html`, `main.tsx`, `App.tsx`, `public/` rather than inheriting upstream fixes. Small, near-static surface, pinned deliberately anyway (§5).

### 2.2 The dividing line: topping can vary it → generate; invariant → template

- **Static template files** (copied byte-for-byte): `src/main.tsx`, `src/App.tsx`, CSS, `public/` assets, `.gitignore`. Real files on disk, so oxlint/oxfmt see them and PRs review the exact bytes the user receives.
- **Programmatically generated**: `package.json` (catalog-injected versions, per-topping scripts), `vite.config.ts` (per-topping plugin list), `tsconfig.json`, `index.html` (its `<title>`), and any config a topping adds.

Rationale: source inside a template literal is invisible to our own tooling; files whose content is computed from versions or topping selection are cleaner as typed code.

Rejected a **template matrix** (`templates/react-ts-tailwind-router/` …) — combinatorial explosion. The additive model is already proven by `brew/logic.ts`.

### 2.3 Templates ship as real files in `dist/`, read at runtime

`files: ["dist"]`; tsdown copies `templates/**` into `dist/templates/**`; the scaffolder resolves via `import.meta.dirname` and reads through `@effect/platform` `FileSystem`.

This is the **first non-compiled asset in the repo** — every current package ships a bundle-only `dist/`, so this needs an explicit copy step tsdown does not do today.

Rejected inlining templates into the bundle as a generated `Record<path, contents>` — adds a codegen step and makes the shipped artifact opaque, giving back the reviewability that motivated static templates.

**Known risk (feeds §9 e2e):** `import.meta.dirname` resolution must survive bundling **and** publish — the classic works-in-dev, breaks-when-published failure.

### 2.4 No substitution engine

Templates are copied verbatim, never parsed. No placeholder syntax, no regex (no SonarQube S8786 exposure). Anything needing interpolation is generated with a **type-checked TypeScript template literal** in a `logic.ts`. `index.html` is on the generated side for its `<title>`.

Rejected **Handlebars** (asked for explicitly): its value is making templates _vary_, which contradicts §2.2; it pulls topping logic out of type-checked `logic.ts` into untyped `.hbs`; and `{{#if}}` inside `App.tsx` stops it being a valid, lintable `.tsx` file. Rejected plain-string `replaceAll('{{appName}}', name)` too — unnecessary once `index.html` is generated.

If a truly invariant file later needs one variable, it **moves to the generated side** rather than reintroducing an engine.

### 2.5 Toppings compose as structured `Contribution` fragments

Each topping exposes a pure `contribution()` returning roughly:

```ts
interface Contribution {
  readonly packages: readonly string[];
  readonly scripts: Readonly<Record<string, string>>;
  readonly viteImports: readonly string[];
  readonly vitePlugins: readonly string[];
  readonly files: readonly ConfigFile[];
}
```

The scaffolder folds `[baseline, ...selectedToppings]` into one value with **one reducer**, then renders `vite.config.ts` and `package.json` from the folded result. Existing `add-*` `logic.ts` functions slot in: `configFile()` → `files`, `getPackages()` → `packages`.

Chosen over `brew`'s flat push-and-dedupe because generated files are not flat — `vite.config.ts` needs a merged import list _and_ a merged plugin list. One reducer holds ordering/dedup rules in one place.

---

## 3. Dependency version strategy

> Owns: [Decide how generated dependency versions stay current (#47)](https://github.com/peeranat-dan/chanom/issues/47)

**Every dependency in the generated `package.json` is pinned exact, injected at build time from the workspace catalog. Currency comes only from publishing a new `create-chanom-app` — no automated mechanism, drift between releases accepted.**

### 3.1 The generated app is a plain React app — no ownership after generation

The scaffolder's job ends when the files land; it never re-enters the app. Consequence: **no `chanom.config.json` in v1** (not even write-only) — nothing comes back to read it, and writing one commits us to a schema a future `chanom add` must live with. v1 apps carry **no chanom footprint** (see §4.1 for the runtime-vs-dev refinement).

### 3.2 All dependencies pinned exact — no carets, no `latest`, no per-group exemption

Rejected a caret tier for "stable API" deps like `react`/`react-dom`/`@types/react*`. If the argument for pinning is "the thing I tested is the thing you get," React earns no exemption. Every user gets an identical app. Matches the repo's `catalogMode: strict` posture.

Accepted cost, stated plainly: the generated `package.json` is a snapshot with a shelf life; **only** publishing a new `create-chanom-app` refreshes it — including security patches. This bites harder than in `@chanom/cli`: `brew` mutates an existing project and routes versions through `getMismatchedPackage` (a stale pin is often a no-op), but `create-chanom-app` writes into an empty directory, so **the pin always wins** — no escape hatch.

### 3.3 No automated currency mechanism for v1

Rejected **adopting Renovate** and rejected a **scheduled CI staleness check** — both are real recurring cost at one-maintainer scale. Currency depends on maintainer attention, exactly as today. Revisitable later; nothing here forecloses it.

> **Repo fact:** this repo has **no Renovate**. Dependency bumps are hand-written edits to `pnpm-workspace.yaml`.

### 3.4 Scaffolded deps go into the workspace catalog

`react`, `react-dom`, `@types/react`, `@types/react-dom`, `@vitejs/plugin-react`, and any topping deps are added to `pnpm-workspace.yaml`. Rejected a package-local `scaffold-versions.ts` — it would give `vite` two numbers (catalog + local) that silently diverge. The catalog choice is a forecast: this repo will host a React app (playground / docs / e2e fixture) and genuinely consume React. `tsdown.config.ts`'s existing `catalogVersion()` parser then serves this package unchanged.

> **Known ordering wrinkle:** catalog entries added before any package consumes them may read as unused; if `knip` flags orphan catalog entries, that is expected noise until the React app arrives.

### 3.5 Missing catalog key **fails the build**

`catalogVersion()` in `packages/cli/tsdown.config.ts` returns literal `'latest'` when a key is absent — benign for the CLI, a **silent failure** here (ships `"react": "latest"`, exactly the unpinned outcome §3.2 rejects). So the scaffolder's lookup **throws at build time** on a missing required key (a strict variant of `catalogVersion()`; see §7). Accepted cost: a small divergence from the CLI's helper.

### 3.6 Catalog keys to add (from §4 baseline + §5 topping)

**Baseline (new catalog keys required):**
`react`, `react-dom`, `@vitejs/plugin-react`, `@tsconfig/vite-react`, `@types/react`, `@types/react-dom`, `jsdom`, `@testing-library/react`, `@testing-library/jest-dom`.

Already in catalog (reused, no new key): `@chanom/dev-config`'s oxlint/oxfmt/knip deps, `vite`, `vitest`, `typescript`, `@vitest/coverage-v8`, `oxlint`, `oxlint-tsgolint`, `oxfmt`.

**commit-hooks topping: ZERO new catalog keys** — `husky`, `lint-staged`, `@commitlint/cli`, `@commitlint/config-conventional` are all already catalogued.

---

## 4. Baseline app contents

> Owns: [Pin down the baseline app contents (#39)](https://github.com/peeranat-dan/chanom/issues/39)

### 4.1 "No chanom footprint" (§3.1) = **runtime only**

No chanom packages in `dependencies`. `@chanom/dev-config` + `@chanom/vite-config` as **devDeps** are baseline and expected. The config files are **one-line re-exports** of dev-config's already-React-shaped `/config` variants (not `/base`) — oxlint adds react + jsx-a11y; vitest via `createReactAppVitestConfig`.

### 4.2 Baseline file tree

```
my-app/
├── README.md
├── .gitignore
├── index.html
├── package.json
├── tsconfig.json          # local, extends @tsconfig/vite-react
├── vite.config.ts         # createViteConfig({ plugins: [react()] })
├── vitest.config.ts       # createReactAppVitestConfig({ plugins:[react()], setupFiles, coverage:true })
├── oxlint.config.ts       # re-export @chanom/dev-config/oxlint/config
├── oxfmt.config.ts        # re-export @chanom/dev-config/oxfmt/config
└── src/
    ├── main.tsx           # createRoot + StrictMode
    ├── App.tsx
    ├── App.test.tsx       # sample RTL test
    ├── index.css
    ├── test-setup.ts      # imports @testing-library/jest-dom/vitest
    └── vite-env.d.ts
```

`knip.config.ts` is **not** baseline. (In v1 knip is neither baseline nor a topping — see §5 and §11.)

**Template vs generated split (per §2.2):**

- **Static templates:** `src/main.tsx`, `src/App.tsx`, `src/App.test.tsx`, `src/index.css`, `src/test-setup.ts`, `src/vite-env.d.ts`, `.gitignore`, README, the three config re-export files (`oxlint.config.ts`, `oxfmt.config.ts`, `vitest.config.ts`, `vite.config.ts` — baseline plugin list is invariant unless a topping varies it).
- **Generated:** `package.json`, `tsconfig.json`, `index.html`. `vite.config.ts` becomes generated **if** a selected topping contributes vite imports/plugins.

### 4.3 Locked baseline decisions

1. **Config wiring uses the `/config` exports, not `/base`** — dev-config's `/oxlint/config` (and `/knip/config`) are purpose-built for a React app (`entry: ['index.html','src/main.tsx']`, `vite: true`), so the app is their intended consumer.
2. **Vitest is baseline** — every app ships `createReactAppVitestConfig` + one sample `App.test.tsx` + `@testing-library/react` + `@testing-library/jest-dom` + `jsdom` + `@vitest/coverage-v8`.
3. **Lint + format are baseline** — `oxlint.config.ts` + `oxfmt.config.ts` always present.
4. **Local `tsconfig` extends `@tsconfig/vite-react`** (community base, one devDep) — not inlined, not `@chanom/tsconfig` (out of scope). Adds `types: ["vite/client", "vitest/globals"]`, `include: ["src"]`.

### 4.4 `package.json` shape

- **`dependencies`** (exact-pinned, catalog-injected per §3): `react`, `react-dom`.
- **`devDependencies`**: `@chanom/dev-config`, `@chanom/vite-config`, `@vitejs/plugin-react`, `@tsconfig/vite-react`, `@types/react`, `@types/react-dom`, `typescript`, `vite`, `vitest`, `@vitest/coverage-v8`, `jsdom`, `@testing-library/react`, `@testing-library/jest-dom`, `oxlint`, `oxlint-tsgolint` (dev-config's oxlint config is type-aware), `oxfmt`.
- **`scripts`**: `dev`, `build` (`tsc -b && vite build`), `preview`, `lint`, `format`, `format:check`, `test`, `test:watch`.
- **`packageManager`**: written from detected/`--pm` PM (see §6).

---

## 5. Topping list — v1 ships exactly ONE topping

> Owns: [Choose the v1 topping list and each topping's behavior (#40)](https://github.com/peeranat-dan/chanom/issues/40)

**v1 ships exactly one topping: `commit-hooks`.** knip is dropped entirely; all runtime toppings are out of scope (§11).

- **commit-hooks** — husky + lint-staged + commitlint, bundled as one coherent unit. Splitting rejected: commitlint with no husky hook to run it does nothing.
- **oxlint + oxfmt stay baseline** (§4) — a scaffolded app with no linter/formatter is a strange default.

### 5.1 `commit-hooks` topping — exact behavior

Contents copied **verbatim from the `chanom brew` sub-commands** (`add-husky`, `add-lint-staged`, `add-commitlint` in `packages/cli/src/commands/`), **not** this monorepo's root config. Note (per §8) the scaffolder does **not** delegate to or call brew — it copies brew's _config choices_.

**Files written:**

- `.husky/pre-commit` → `lint-staged\n`
- `.husky/commit-msg` → `pnpm exec commitlint --edit $1\n` (pnpm is the generated app's PM; `PM_EXEC[pnpm]`)
- `.lintstagedrc.json` (standalone):
  ```json
  {
    "**/*.{js,jsx,ts,tsx,mjs,cjs,mts,cts}": ["oxlint --fix --no-error-on-unmatched-pattern"],
    "*": ["oxfmt --no-error-on-unmatched-pattern"]
  }
  ```
- `.commitlintrc.json` (standalone): `{ "extends": ["@commitlint/config-conventional"] }`

**`package.json` changes:**

- **devDependencies** (exact-pinned, catalog-injected): `husky`, `lint-staged`, `@commitlint/cli`, `@commitlint/config-conventional` — **all already in the catalog, zero new catalog keys**.
- **scripts**: add **only** `"prepare": "husky"` (baseline already has `lint`/`format`).

**No `husky init` subprocess** (per §3 generate-then-stop; `husky init` needs deps installed first — chicken-and-egg). We write the two hook files directly; husky's `.husky/_/` materializes on the user's first `pnpm install` when `prepare: "husky"` runs. We do **not** commit `.husky/_/`.

---

## 6. Prompt flow & CLI flags

> Owns: [Design the prompt flow and CLI flags (#41)](https://github.com/peeranat-dan/chanom/issues/41) · Prototype: [`prototype/41-prompt-flow`](https://github.com/peeranat-dan/chanom/tree/prototype/41-prompt-flow/.wayfinder/41-prompt-flow)

### 6.1 Interactive prompt sequence

1. **Project name** — only if positional `[directory]` omitted. Validated: non-empty; `[a-z0-9._-]` charset; cannot start with a dot. `.` allowed (scaffold into cwd).
2. **Initialize a git repository?** — default **yes**.
3. **Add commit hooks (husky + lint-staged + commitlint)?** — default **yes**, **GATED on git**. If git = no, this prompt is skipped entirely (husky installs into `.git`, mirroring `chanom brew`'s `NotAtRepoRoot`).
4. **Install dependencies now?** — default **yes**.

Then a **plan summary** is printed (directory, package manager, git, commit hooks, install) + next-steps outro. **No separate "Proceed?" confirm** — the plan summary is the review point.

### 6.2 Flags — each mirrors a prompt or default

| Flag                                   | Mirrors                                       |
| -------------------------------------- | --------------------------------------------- |
| `[directory]` (positional)             | Project name prompt                           |
| `--commit-hooks` / `--no-commit-hooks` | Commit-hooks prompt                           |
| `--git` / `--no-git`                   | Git prompt (`--no-git` disables commit-hooks) |
| `--install` / `--no-install`           | Install prompt                                |
| `--pm <pnpm\|npm\|yarn\|bun>`          | Package-manager override                      |
| `-y`, `--yes`                          | Skip all prompts, accept defaults             |
| `--help`, `--version`                  | —                                             |

Resolution precedence: **flag → prompt (unless `--yes`) → default**.

### 6.3 Locked decisions

- **`--yes` (CI mode)** = accept all interactive defaults: **git yes + commit-hooks yes + install yes** (identical to pressing Enter through the wizard). No prompts.
- **Flag conflict** `--no-git --commit-hooks` is contradictory → **error out** (`✖ --commit-hooks requires a git repo.`), exit non-zero. Not silently reconciled.
- **Existing non-empty target directory** → **refuse / abort** (`✖ <dir> is not empty. Aborting.`), exit non-zero. No overwrite prompt, no clobber.
- **Package-manager detection** — a create-* tool has no target `package.json`, so detection is **solely** from `npm_config_user_agent` (set by the `npm/pnpm/yarn/bun create` launcher), fallback **pnpm**. `--pm` overrides. The resolved PM is written into the generated `package.json` `packageManager` field. (Differs from `chanom brew`, which reads an existing project's `packageManager`.)
- **Post-scaffold steps** — git (init + initial commit) and install both default on, both flag-controllable. Generate-then-stop: no `husky init` subprocess.

Real implementation uses `@clack/prompts` `text`/`confirm` via the shared `Prompter` (moved to `@chanom/internal`, §8), not the prototype's raw readline.

---

## 7. Code sharing with `@chanom/cli`

> Owns: [Decide code sharing with @chanom/cli (#38)](https://github.com/peeranat-dan/chanom/issues/38)

`create-chanom-app` reuses `@chanom/cli` internals through a **new private workspace package, `@chanom/internal`**, bundled into both consumers at build time. **Not** a workspace dependency on `@chanom/cli`, **not** copying, and **not** shelling out to `chanom brew`.

### 7.1 Mechanism: extract to a private, bundled workspace package

`packages/internal`, **`"private": true`**, consumed as `"@chanom/internal": "workspace:*"` by both `@chanom/cli` and `create-chanom-app`. tsdown **inlines** it into each consumer's bundle, so it never reaches npm and never appears in a generated app's dependency tree.

Rejected a published `@chanom/core` (ceremony: 4th published package, own version, changeset every touch, catalog entry, manual bump on a no-Renovate repo). Rejected `create-chanom-app` depending on `@chanom/cli` directly (makes CLI internals a semver-relevant public API; drags the whole CLI in as a runtime dep to reach four services).

> **This is the first `private: true` package in the repo** — every existing `packages/*` entry publishes. `private: true` was preferred over a new top-level `internal/`/`tooling/` directory (the flag is unambiguous; a new directory means editing workspace globs for one package).

### 7.2 Delegating to `chanom brew` — rejected

`brew` is an **interactive session** (its own `intro`, topping `multiselect`, sweetness `select`, central act `installer.installDev` = `pnpm add -D`), not a plan→files function. Three independent problems: (1) **double prompt flow + double install**; (2) **breaks pinned-exact deps** — `pnpm add -D` writes carets and rewrites `package.json`, no way to get pinned-exact output; (3) **runtime drift replaces build-time drift** — the npm-resolved `@chanom/cli` version at generation time is what the user gets.

### 7.3 What moves and what stays

**Moves to `@chanom/internal`** (the genuinely shared ~230 lines):

- `CommandRunner` — both packages shell out.
- `Prompter` — the whole §6 prompt flow is built on it.
- `Git` — `init` / `stageAll` / `commit` / `hasIdentity` / `setLocalIdentity` / `hasStagedChanges` (moves whole rather than split).
- `resolvePm`, `parsePmUserAgent`, `PM_EXEC`, the `PackageManager` type.

**Stays in `@chanom/cli`** (all exist to interrogate a project that already exists, which a scaffolder does not have): `readPkg`/`writePkg`, `getMismatchedPackage`, `isPackageInstalled`, `isEsm`, `WorkspaceHints`, `workspaceRootFlags`, `PackageInstaller`, `detectPm`, `parsePmField`, `Git.isRepo`/`prefix`/`root`/`readGitignore`.

### 7.4 The shared package also owns catalog version reading

`@chanom/internal` exports the `catalogVersion` reader currently inlined in `packages/cli/tsdown.config.ts`, for **build-time** use. Both tsdown configs call the same reader against the same `pnpm-workspace.yaml` and inject their own `__*_VERSION__` globals — one source of truth, two injections. This is where §3.5's **strict (throwing) lookup** lives. The `ToolVersions` shape widens for `create-chanom-app`'s React/topping catalog entries and lives in `@chanom/internal` too.

> **Prerequisite refactor:** the `packages/internal` extraction is a refactor of `@chanom/cli` that lands **before or alongside** the scaffolder build — it is not part of the scaffolder package itself.

---

## 8. Testing & verification strategy

> Owns: [Decide the testing and verification strategy (#42)](https://github.com/peeranat-dan/chanom/issues/42)

**Two layers:** a fast unit layer (always in `pnpm test`) + a rare, path-gated e2e smoke (separate).

### 8.1 Unit layer — mirrors `@chanom/cli`

- `@effect/vitest` + in-memory Map-backed layers (`makeTestFs` / `makeTestRunner` / `makeTestPrompter`). No real disk, no subprocess.
- **Primary assertion: the pure `Contribution` reducer as data** — which files / deps / scripts / prompts a given flag set folds to (§2.5).
- **Byte-assert the generated `package.json`** (deps + scripts). Verbatim static templates get a **path-landing check only** — no content snapshot (their content is trusted; snapshotting tests a file equals itself).
- **Vitest config:** compose the shared `createVitestConfig` factory (node env, coverage shape) + a **hand-written `define` block** faking the build-time version constants (`__*_VERSION__`) that tsdown injects from the catalog (§3/§7). **Node** environment (the scaffolder is a Node CLI; React lives in the generated app's own config).
- **Assert no generated `package.json` ever contains `latest` or a range** — complements the §3.5 build-time throw.
- **Coverage: 100% aim, 90% enforced floor** (statements/branches/functions/lines). Same exclusions as cli — the layer-wiring `index.ts`, type-only files.

### 8.2 E2E layer — separate, path-gated, NOT in `pnpm test`

- Generate a real app to a temp dir → **real `pnpm install` from npm** (resolves the **published** `@chanom/*` configs, not local `dist/`) → run the **full check set** on the generated app: `build` + oxlint + oxfmt + `typecheck` + `test`, asserting **exit 0** on each.
- **Single default-flags happy path** (git + commit-hooks + install), **not a flag matrix** (the matrix is covered cheaply by the unit layer).
- Lives in a **separate `e2e.yml`** workflow.
- **Path filter:** `packages/create-chanom-app/**`, root `package.json`, `pnpm-lock.yaml`, and `e2e.yml` itself.
- **Required to merge, with one automatic retry** on the install step (absorbs transient registry flakes).
- Also exercises the §2.3 post-publish `import.meta.dirname` template resolution risk and the §7.1 bundled-private-package boundary (verify `@chanom/internal` is inlined and absent from the published dependency tree).

### 8.3 Accepted boundary (deliberate)

Because e2e installs the **published** `@chanom/*` packages, a PR that changes `@chanom/vite-config`/`dev-config` **and** a generated template in lockstep is **not proven end-to-end until after both publish**. The e2e is a **published-surface smoke** by design; unreleased-config breakage is caught by that package's own unit tests + the next release's e2e.

---

## 9. Packaging & release

> Owns: the **"Release specifics"** fog patch from [#36](https://github.com/peeranat-dan/chanom/issues/36), sharpened at spec assembly. Name availability from [Check npm availability of the create-chanom-app name (#43)](https://github.com/peeranat-dan/chanom/issues/43).

### 9.1 Name & bin (verified 2026-07-28)

- `create-chanom-app` is **free on npm** — claim it, no fallback. Both `npm create chanom-app` and `pnpm create chanom-app` expand to exactly `create-chanom-app` (verified empirically). `yarn create chanom-app` follows the same prefix convention.
- `@chanom` scope is **owned by this account** (`ninprd <ppeeranat.d@gmail.com>`). Only 5 `chanom` packages exist → no name-similarity rejection risk.
- **`bin` key** (required for `npm create` to execute):
  ```json
  { "bin": { "create-chanom-app": "./dist/index.js" } }
  ```
  **No short alias** (create-vite ships `cva`; we ship none). The `@chanom/create` fallback is **dead** — dropped.

### 9.2 Manifest essentials

Mirrors `@chanom/cli`'s manifest posture:

```jsonc
{
  "name": "create-chanom-app",
  "version": "0.0.0", // see §9.3 — first changeset publishes 0.1.0
  "type": "module",
  "bin": { "create-chanom-app": "./dist/index.js" },
  "files": ["dist"], // dist includes dist/templates/** (§2.3)
  "scripts": {
    "build": "tsdown",
    "prepublishOnly": "tsdown",
    // ...test scripts as per §8
  },
  "publishConfig": { "access": "public" },
}
```

`@chanom/internal` is a **`workspace:*` devDependency** and is **bundled** (§7.1), so it does not appear in the published dependency tree.

### 9.3 Version & changeset flow

- **Initial version:** manifest ships **`0.0.0`**; the introducing changeset is a **minor** → first published version is **`0.1.0`** (matches the pre-1.0 posture of `@chanom/cli` at `0.2.2`).
- **Changeset flow is the same as every other package** — one changeset introducing `create-chanom-app`, published by the existing `release.yml`. Repo changeset config is `access: public`, `commit: false`, `baseBranch: main`.
- **`@chanom/internal` guardrail (explicit):** it must be **`private: true`** so changesets and the release pipeline never attempt to publish it, and it is **bundled** into consumers rather than declared as a runtime dependency. This is the first private package in the repo (§7.1), so the guardrail is called out deliberately — nothing else should ever ship it to npm.

---

## 10. Consolidated build order (implementation hand-off)

Not a decision — an ordering read from the dependencies above, to orient whoever implements:

1. **Extract `@chanom/internal`** (`private: true`) from `@chanom/cli`: `CommandRunner`, `Prompter`, `Git`, PM resolution, and the shared **strict** catalog version reader (§7). Rewire `@chanom/cli` to consume it. This lands first or alongside step 3.
2. **Add catalog keys** (§3.6) to `pnpm-workspace.yaml`.
3. **Build `create-chanom-app`**: template files (§2, §4), the `Contribution` reducer + toppings (§2.5, §5), the prompt flow + flags (§6), tsdown config with template copy + strict version injection (§2.3, §3.5).
4. **Tests**: unit layer (§8.1) + `e2e.yml` (§8.2).
5. **Release wiring**: manifest (§9.2), initial changeset for `0.1.0` (§9.3).

---

## 11. Out of scope (ruled out on this route)

Fixed by the destination; each returns only as a **fresh effort**, not a resumption of this map.

- **JavaScript (non-TS) templates** — TS only.
- **Non-React frameworks** (Vue, Svelte, vanilla).
- **Monorepo / workspace scaffolding** — explicitly the next iteration's effort.
- **`chanom create` alias inside `@chanom/cli`** — standalone package, not a subcommand.
- **Building / adopting `@chanom/tsconfig`** — next version; the package is **not actually published** (npm 404s; `packages/tsconfig` is an empty husk). v1 ships a local `tsconfig`.
- **Implementing the CLI itself** — the destination is the spec; implementation happens off the map.
- **A `chanom.config.json` in the generated app** (shadcn `components.json` style) — ruled out by §3.1: v1 apps carry no chanom footprint, nothing reads it.
- **Any post-generation upgrade path** — `chanom upgrade`, codemods, migrating an already-scaffolded app. The scaffolder's job ends when the files land.
- **Adopting Renovate or a CI staleness check** — §3.3 declined both for v1; revisitable as its own effort.
- **Runtime toppings that add `@chanom/*` / library entries to the app's runtime `dependencies`** — **router, `@chanom/analytics`, `@chanom/logger`**. Each breaks §4.1's "no chanom footprint = runtime deps only" and needs generated product code — a future runtime-toppings effort.
- **A `knip` topping** — considered in #39/#40 and dropped from v1 entirely (neither baseline nor topping).

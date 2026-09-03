// Injected at build time by tsdown `define`, and by vitest for tests.

/** This package's own version, shown by `--version`. */
declare const __PKG_VERSION__: string;

/**
 * Exact, catalog-sourced version for every dependency the generator can emit,
 * keyed by package name. Built from `pnpm-workspace.yaml` (+ the two workspace
 * config packages) so generated apps are always pinned to a known-good set.
 */
declare const __DEP_VERSIONS__: Readonly<Record<string, string>>;

/**
 * Inlined skill markdown, injected by this package's tsdown/vitest `define`.
 * Declared here as well as in @chanom/internal because this package compiles
 * internal's source directly, and tsc only auto-includes its own .d.ts files.
 */
declare const __CODING_STANDARDS_FILES__: readonly {
  readonly path: string;
  readonly contents: string;
}[];

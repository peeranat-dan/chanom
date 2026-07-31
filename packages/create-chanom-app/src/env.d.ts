// Injected at build time by tsdown `define`, and by vitest for tests.

/** This package's own version, shown by `--version`. */
declare const __PKG_VERSION__: string;

/**
 * Exact, catalog-sourced version for every dependency the generator can emit,
 * keyed by package name. Built from `pnpm-workspace.yaml` (+ the two workspace
 * config packages) so generated apps are always pinned to a known-good set.
 */
declare const __DEP_VERSIONS__: Readonly<Record<string, string>>;

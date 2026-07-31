import type { DepVersions } from './domain/versions.ts';

// Injected at build time by tsdown `define` (from the workspace catalog), and
// by vitest for tests.
export const depVersions: DepVersions = __DEP_VERSIONS__;

/** This package's own version, for `--version`. */
export const pkgVersion: string = __PKG_VERSION__;

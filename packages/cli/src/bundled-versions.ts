import type { ToolVersions } from './domain/versions.ts';

// The globals are injected at build time (tsdown `define`) and by vitest for tests.
export const bundledVersions: ToolVersions = {
  oxlint: __OXLINT_VERSION__,
  oxlintTsgolint: __OXLINT_TSGOLINT_VERSION__,
  oxfmt: __OXFMT_VERSION__,
  knip: __KNIP_VERSION__,
  devConfig: __DEV_CONFIG_VERSION__,
};

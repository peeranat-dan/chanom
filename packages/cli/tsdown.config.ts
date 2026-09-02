import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { defineConfig } from 'tsdown';

// Shared, build-time-only catalog reader (single source of truth for both this
// package and create-chanom-app). Imported by relative path because it is build
// tooling, never bundled into the shipped output.
import { catalogVersion } from '../internal/src/catalog/version.ts';
import { readCodingStandardsFiles } from '../internal/src/skills/build-skill-files.ts';

const oxlintVersion = catalogVersion('oxlint');
const oxlintTsgolintVersion = catalogVersion('oxlint-tsgolint');
const oxfmtVersion = catalogVersion('oxfmt');
const knipVersion = catalogVersion('knip');

const devConfigPkg = readFileSync(join(import.meta.dirname, '../dev-config/package.json'), 'utf-8');
const devConfigVersion = (JSON.parse(devConfigPkg) as { version: string }).version;

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  clean: true,
  // @chanom/internal is private (never published); inline it so the shipped
  // bundle is self-contained and it never appears in the dependency tree.
  deps: { alwaysBundle: ['@chanom/internal'] },
  outExtensions: () => ({ js: '.js', dts: '.d.ts' }),
  define: {
    __CODING_STANDARDS_FILES__: JSON.stringify(readCodingStandardsFiles()),
    __OXLINT_VERSION__: JSON.stringify(oxlintVersion),
    __OXLINT_TSGOLINT_VERSION__: JSON.stringify(oxlintTsgolintVersion),
    __OXFMT_VERSION__: JSON.stringify(oxfmtVersion),
    __KNIP_VERSION__: JSON.stringify(knipVersion),
    __DEV_CONFIG_VERSION__: JSON.stringify(devConfigVersion),
  },
});

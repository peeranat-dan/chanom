import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { defineConfig } from 'tsdown';

// Shared, build-time-only catalog reader (single source of truth with cli).
// Strict variant: a missing catalog key fails the build rather than shipping
// an unpinned `latest`.
import { catalogVersionStrict } from '../internal/src/catalog/version.ts';
import { readCodingStandardsFiles } from '../internal/src/skills/build-skill-files.ts';
import { CATALOG_PACKAGES, WORKSPACE_PACKAGES } from './src/domain/catalog-packages.ts';

const readVersion = (relPath: string): string => {
  const contents = readFileSync(join(import.meta.dirname, relPath), 'utf-8');
  return (JSON.parse(contents) as { version: string }).version;
};

const pkgVersion = readVersion('package.json');

// Exact, pinned version for every dependency the generator can emit.
const depVersions: Record<string, string> = {};
for (const name of CATALOG_PACKAGES) {
  depVersions[name] = catalogVersionStrict(name);
}
for (const workspace of WORKSPACE_PACKAGES) {
  depVersions[workspace.name] = readVersion(`../${workspace.dir}/package.json`);
}

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  clean: true,
  // @chanom/internal is private (never published); inline it so the shipped
  // bundle is self-contained and it never appears in the dependency tree.
  deps: { alwaysBundle: ['@chanom/internal'] },
  // Ship the static templates alongside the bundle (lands at dist/templates,
  // resolved via import.meta.dirname).
  copy: [{ from: 'templates', to: 'dist' }],
  outExtensions: () => ({ js: '.js', dts: '.d.ts' }),
  define: {
    __CODING_STANDARDS_FILES__: JSON.stringify(readCodingStandardsFiles()),
    __PKG_VERSION__: JSON.stringify(pkgVersion),
    __DEP_VERSIONS__: JSON.stringify(depVersions),
  },
});

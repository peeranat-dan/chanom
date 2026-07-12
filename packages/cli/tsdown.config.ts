import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { defineConfig } from 'tsdown';

const workspace = readFileSync(join(import.meta.dirname, '../../pnpm-workspace.yaml'), 'utf-8');

const catalogVersion = (tool: string): string => {
  const prefix = `${tool}:`;
  for (const line of workspace.split('\n')) {
    const entry = line.trimStart();
    // only indented lines are catalog entries, not top-level keys
    if (entry !== line && entry.startsWith(prefix)) {
      const version = entry.slice(prefix.length).trim();
      if (version !== '') return version;
    }
  }
  return 'latest';
};

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
  outExtensions: () => ({ js: '.js', dts: '.d.ts' }),
  define: {
    __OXLINT_VERSION__: JSON.stringify(oxlintVersion),
    __OXLINT_TSGOLINT_VERSION__: JSON.stringify(oxlintTsgolintVersion),
    __OXFMT_VERSION__: JSON.stringify(oxfmtVersion),
    __KNIP_VERSION__: JSON.stringify(knipVersion),
    __DEV_CONFIG_VERSION__: JSON.stringify(devConfigVersion),
  },
});

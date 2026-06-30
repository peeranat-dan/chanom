import { log } from '@clack/prompts';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { isPackageInstalled, readPkg, type Pkg } from '../../utils/pkg.ts';

export function getPackages(pkg: Pkg): string[] {
  return isPackageInstalled(pkg, 'eslint') ? [] : ['eslint'];
}

export function apply(cwd: string, esm: boolean): void {
  const ext = esm ? 'ts' : 'mts';
  writeFileSync(
    join(cwd, `eslint.config.${ext}`),
    `export { default } from '@chanom/dev-config/eslint/config';\n`,
  );

  const { pkg, pkgPath } = readPkg(cwd);

  pkg.scripts ??= {};

  const missing: Record<string, string> = {};
  if (!pkg.scripts['lint']) missing['lint'] = 'eslint .';
  if (!pkg.scripts['lint:fix']) missing['lint:fix'] = 'eslint . --fix';

  for (const [key, value] of Object.entries(missing)) {
    pkg.scripts[key] = value;
  }

  const skipped = (['lint', 'lint:fix'] as const).filter((k) => !(k in missing));
  for (const key of skipped) {
    log.warn(`\`${key}\` script already exists in package.json - skipping`);
  }

  if (Object.keys(missing).length > 0) {
    writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
  }
}

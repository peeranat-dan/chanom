import { log } from '@clack/prompts';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { isPackageInstalled, readPkg, type Pkg } from '../../utils/pkg.ts';

export function getPackages(pkg: Pkg): string[] {
  return isPackageInstalled(pkg, 'prettier') ? [] : ['prettier'];
}

export function apply(cwd: string): void {
  writeFileSync(join(cwd, '.prettierrc'), JSON.stringify({}, null, 2) + '\n');

  const { pkg, pkgPath } = readPkg(cwd);

  pkg.scripts ??= {};

  const missing: Record<string, string> = {};
  if (!pkg.scripts['format']) missing['format'] = 'prettier --write .';
  if (!pkg.scripts['format:check']) missing['format:check'] = 'prettier --check .';

  for (const [key, value] of Object.entries(missing)) {
    pkg.scripts[key] = value;
  }

  const skipped = (['format', 'format:check'] as const).filter((k) => !(k in missing));
  for (const key of skipped) {
    log.warn(`\`${key}\` script already exists in package.json - skipping`);
  }

  if (Object.keys(missing).length > 0) {
    writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
  }
}

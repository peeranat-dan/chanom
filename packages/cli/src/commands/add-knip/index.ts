import { log } from '@clack/prompts';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { isPackageInstalled, readPkg, type Pkg } from '../../utils/pkg.ts';
import { getMissingScripts } from './logic.ts';

export function getPackages(pkg: Pkg): string[] {
  return isPackageInstalled(pkg, 'knip') ? [] : [`knip@${__KNIP_VERSION__}`, '@chanom/dev-config'];
}

export function apply(cwd: string, esm: boolean): void {
  const ext = esm ? 'ts' : 'mts';
  writeFileSync(
    join(cwd, `knip.config.${ext}`),
    `export { default } from '@chanom/dev-config/knip/config';\n`,
  );

  const { pkg, pkgPath } = readPkg(cwd);

  pkg.scripts ??= {};
  const missing = getMissingScripts(pkg.scripts);

  for (const [key, value] of Object.entries(missing)) {
    pkg.scripts[key] = value;
  }

  const skipped = (['knip'] as const).filter((k) => !(k in missing));
  for (const key of skipped) {
    log.warn(`\`${key}\` script already exists in package.json - skipping`);
  }

  if (Object.keys(missing).length > 0) {
    writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
  }
}

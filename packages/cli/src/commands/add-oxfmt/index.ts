import { log } from '@clack/prompts';
import { writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';

import { detectSetupFile } from '../../utils/detect-setup.ts';
import { isPackageInstalled, readPkg, type Pkg } from '../../utils/pkg.ts';
import { getMissingScripts } from './logic.ts';

export function getPackages(pkg: Pkg): string[] {
  return isPackageInstalled(pkg, 'oxfmt')
    ? []
    : [`oxfmt@${__OXFMT_VERSION__}`, `@chanom/dev-config@${__DEV_CONFIG_VERSION__}`];
}

export function apply(cwd: string, esm: boolean): void {
  const existing = detectSetupFile('oxfmt', cwd);
  if (existing) {
    log.warn(`\`${basename(existing)}\` already exists - skipping oxfmt config`);
  } else {
    const ext = esm ? 'ts' : 'mts';
    writeFileSync(
      join(cwd, `oxfmt.config.${ext}`),
      `export { default } from '@chanom/dev-config/oxfmt/config';\n`,
    );
  }

  const { pkg, pkgPath } = readPkg(cwd);

  pkg.scripts ??= {};
  const missing = getMissingScripts(pkg.scripts);

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

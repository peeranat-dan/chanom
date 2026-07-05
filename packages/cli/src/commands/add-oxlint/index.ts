import { log } from '@clack/prompts';
import { writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';

import { detectSetupFile } from '../../utils/detect-setup.ts';
import { getMismatchedPackage, readPkg, type Pkg } from '../../utils/pkg.ts';
import { getMissingScripts } from './logic.ts';

export function getPackages(pkg: Pkg): string[] {
  return [
    getMismatchedPackage(pkg, 'oxlint', __OXLINT_VERSION__),
    getMismatchedPackage(pkg, '@chanom/dev-config', __DEV_CONFIG_VERSION__),
  ].filter((p): p is string => p !== undefined);
}

export function apply(cwd: string, esm: boolean): void {
  const existing = detectSetupFile('oxlint', cwd);
  if (existing) {
    log.warn(`\`${basename(existing)}\` already exists - skipping oxlint config`);
  } else {
    const ext = esm ? 'ts' : 'mts';
    writeFileSync(
      join(cwd, `oxlint.config.${ext}`),
      `export { default } from '@chanom/dev-config/oxlint/config';\n`,
    );
  }

  const { pkg, pkgPath } = readPkg(cwd);

  pkg.scripts ??= {};
  const missing = getMissingScripts(pkg.scripts);

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

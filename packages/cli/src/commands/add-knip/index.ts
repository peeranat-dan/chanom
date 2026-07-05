import { log } from '@clack/prompts';
import { FileSystem, Path } from '@effect/platform';
import { Effect } from 'effect';

import { detectSetupFile } from '../../utils/detect-setup.ts';
import { isPackageInstalled, type Pkg } from '../../utils/pkg.ts';
import { getMissingScripts } from './logic.ts';

export function getPackages(pkg: Pkg): string[] {
  return isPackageInstalled(pkg, 'knip')
    ? []
    : [`knip@${__KNIP_VERSION__}`, `@chanom/dev-config@${__DEV_CONFIG_VERSION__}`];
}

// Mutates `pkg.scripts` in place; the caller owns writing package.json.
export const apply = (cwd: string, esm: boolean, pkg: Pkg) =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem;
    const path = yield* Path.Path;

    const existing = detectSetupFile('knip', cwd);

    if (existing) {
      log.warn(`\`${path.basename(existing)}\` already exists - skipping knip config`);
    } else {
      const fileExtension = esm ? 'ts' : 'mts';
      yield* fs.writeFileString(
        path.join(cwd, `knip.config.${fileExtension}`),
        `export { default } from '@chanom/dev-config/knip/config';\n`,
      );
    }

    pkg.scripts ??= {};
    const missing = getMissingScripts(pkg.scripts);

    for (const [key, value] of Object.entries(missing)) {
      pkg.scripts[key] = value;
    }

    const skipped = (['knip'] as const).filter((k) => !(k in missing));
    for (const key of skipped) {
      log.warn(`\`${key}\` script already exists in package.json - skipping`);
    }
  });

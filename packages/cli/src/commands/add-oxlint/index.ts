import { log } from '@clack/prompts';
import { FileSystem, Path } from '@effect/platform';
import { Effect } from 'effect';

import { detectSetupFile } from '../../utils/detect-setup.ts';
import { getMismatchedPackage, type Pkg } from '../../utils/pkg.ts';
import { getMissingScripts } from './logic.ts';

export function getPackages(pkg: Pkg): string[] {
  return [
    getMismatchedPackage(pkg, 'oxlint', __OXLINT_VERSION__),
    getMismatchedPackage(pkg, '@chanom/dev-config', __DEV_CONFIG_VERSION__),
  ].filter((p): p is string => p !== undefined);
}

// Mutates `pkg.scripts` in place; the caller owns writing package.json.
export const apply = (cwd: string, esm: boolean, pkg: Pkg) =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem;
    const path = yield* Path.Path;

    const existing = detectSetupFile('oxlint', cwd);

    if (existing) {
      log.warn(`\`${path.basename(existing)}\` already exists - skipping oxlint config`);
    } else {
      const fileExtension = esm ? 'ts' : 'mts';
      yield* fs.writeFileString(
        path.join(cwd, `oxlint.config.${fileExtension}`),
        `export { default } from '@chanom/dev-config/oxlint/config';\n`,
      );
    }

    pkg.scripts ??= {};

    const missing = getMissingScripts(pkg.scripts);

    for (const [key, value] of Object.entries(missing)) {
      pkg.scripts[key] = value;
    }

    const skipped = (['lint', 'lint:fix'] as const).filter((k) => !(k in missing));
    for (const key of skipped) {
      log.warn(`\`${key}\` script already exists in package.json - skipping`);
    }
  });

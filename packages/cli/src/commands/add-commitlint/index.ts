import { FileSystem, Path } from '@effect/platform';
import { Effect, Option } from 'effect';

import type { PackageManager } from '../../domain/package-manager.ts';

import { Prompter } from '../../services/prompter.ts';
import { detectSetupFile } from '../../utils/detect-setup.ts';
import { commitMsgHook, CONFIG_CONTENTS } from './logic.ts';

export { getPackages } from './logic.ts';

export const apply = Effect.fn('add-commitlint.apply')(function* (cwd: string, pm: PackageManager) {
  const fs = yield* FileSystem.FileSystem;
  const path = yield* Path.Path;
  const prompter = yield* Prompter;

  const existing = yield* detectSetupFile('commitlint', cwd);

  if (Option.isSome(existing)) {
    yield* prompter.warn(
      `\`${path.basename(existing.value)}\` already exists - skipping commitlint config`,
    );
  } else {
    yield* fs.writeFileString(path.join(cwd, '.commitlintrc.json'), CONFIG_CONTENTS);
  }

  const huskyDir = path.join(cwd, '.husky');

  if (yield* fs.exists(huskyDir)) {
    const hookPath = path.join(huskyDir, 'commit-msg');
    if (yield* fs.exists(hookPath)) {
      yield* prompter.warn('`.husky/commit-msg` already exists - skipping');
    } else {
      yield* fs.writeFileString(hookPath, commitMsgHook(pm));
    }
  }
});

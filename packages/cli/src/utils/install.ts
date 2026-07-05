import type { CommandExecutor } from '@effect/platform/CommandExecutor';
import type { PlatformError } from '@effect/platform/Error';

import { Command } from '@effect/platform';
import { Effect } from 'effect';

import type { PackageManager } from './detect-pm.ts';

export const installDev = (
  pm: PackageManager,
  cwd: string,
  ...packages: string[]
): Effect.Effect<boolean, PlatformError, CommandExecutor> =>
  Command.make(pm, 'add', '-D', ...packages).pipe(
    Command.workingDirectory(cwd),
    Command.stdout('inherit'),
    Command.stderr('inherit'),
    Command.exitCode,
    Effect.map((code) => code === 0),
  );

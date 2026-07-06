import { NodeContext } from '@effect/platform-node';
import { describe, expect, it } from '@effect/vitest';
import { Effect, Layer } from 'effect';

import { CommandRunner } from '../../src/services/command-runner.ts';

const live = CommandRunner.Default.pipe(Layer.provide(NodeContext.layer));

describe('CommandRunner (live)', () => {
  it.effect('captures exit code and trimmed output of a real process', () =>
    Effect.gen(function* () {
      const runner = yield* CommandRunner;
      const output = yield* runner.capture(
        'node',
        ['-e', 'console.log(" out "); console.error("err"); process.exitCode = 3'],
        process.cwd(),
      );
      expect(output).toEqual({ exitCode: 3, stdout: 'out', stderr: 'err' });
    }).pipe(Effect.provide(live)),
  );

  it.effect('returns only the exit code for exitCode', () =>
    Effect.gen(function* () {
      const runner = yield* CommandRunner;
      const code = yield* runner.exitCode('node', ['-e', 'process.exitCode = 0'], process.cwd());
      expect(code).toBe(0);
    }).pipe(Effect.provide(live)),
  );
});

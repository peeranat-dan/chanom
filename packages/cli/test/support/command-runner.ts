import { Effect, Layer } from 'effect';

import type { CommandOutput } from '../../src/services/command-runner.ts';

import { CommandRunner } from '../../src/services/command-runner.ts';

export interface RecordedCommand {
  readonly cmd: string;
  readonly args: readonly string[];
  readonly cwd: string;
}

export type CommandHandler = (call: RecordedCommand) => CommandOutput;

export interface TestRunner {
  readonly layer: Layer.Layer<CommandRunner>;
  /** Every command executed, in order. */
  readonly calls: RecordedCommand[];
}

const succeed: CommandHandler = () => ({ exitCode: 0, stdout: '', stderr: '' });

/** CommandRunner that records calls and responds via `handler` instead of spawning processes. */
export const makeTestRunner = (handler: CommandHandler = succeed): TestRunner => {
  const calls: RecordedCommand[] = [];

  const respond = (cmd: string, args: readonly string[], cwd: string): CommandOutput => {
    const call: RecordedCommand = { cmd, args, cwd };
    calls.push(call);
    return handler(call);
  };

  const runner = new CommandRunner({
    capture: (cmd, args, cwd) => Effect.sync(() => respond(cmd, args, cwd)),
    exitCode: (cmd, args, cwd) => Effect.sync(() => respond(cmd, args, cwd).exitCode),
    execInherit: (cmd, args, cwd) => Effect.sync(() => respond(cmd, args, cwd).exitCode),
  });

  return { layer: Layer.succeed(CommandRunner, runner), calls };
};

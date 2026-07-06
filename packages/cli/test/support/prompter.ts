import { Effect, Layer } from 'effect';

import type {
  MultiselectParams,
  SelectParams,
  SpinnerHandle,
} from '../../src/services/prompter.ts';

import { Cancelled, Prompter } from '../../src/services/prompter.ts';

export interface SpinnerRecord {
  readonly start: string;
  stop: string | undefined;
}

export interface PrompterLog {
  readonly intros: string[];
  readonly outros: string[];
  readonly warnings: string[];
  readonly errors: string[];
  readonly debugs: string[];
  readonly spinners: SpinnerRecord[];
}

export interface TestPrompter {
  readonly layer: Layer.Layer<Prompter>;
  readonly log: PrompterLog;
}

/**
 * Prompter that answers prompts from `answers` (keyed by prompt message) and
 * records everything it is asked to display. Unanswered prompts fail with Cancelled.
 */
export const makeTestPrompter = (answers: Record<string, unknown> = {}): TestPrompter => {
  const log: PrompterLog = {
    intros: [],
    outros: [],
    warnings: [],
    errors: [],
    debugs: [],
    spinners: [],
  };

  const answer = <T>(message: string): Effect.Effect<T, Cancelled> =>
    message in answers ? Effect.succeed(answers[message] as T) : Effect.fail(new Cancelled());

  const prompter = new Prompter({
    intro: (message) => Effect.sync(() => void log.intros.push(message)),
    outro: (message) => Effect.sync(() => void log.outros.push(message)),
    warn: (message) => Effect.sync(() => void log.warnings.push(message)),
    error: (message) => Effect.sync(() => void log.errors.push(message)),
    debug: (message) => Effect.sync(() => void log.debugs.push(message)),
    select: <T>(params: SelectParams<T>) => answer<T>(params.message),
    multiselect: <T>(params: MultiselectParams<T>) => answer<T[]>(params.message),
    spinner: (message) =>
      Effect.sync(() => {
        const record: SpinnerRecord = { start: message, stop: undefined };
        log.spinners.push(record);
        const handle: SpinnerHandle = {
          stop: (stopMessage) =>
            Effect.sync(() => {
              record.stop = stopMessage;
            }),
        };
        return handle;
      }),
  });

  return { layer: Layer.succeed(Prompter, prompter), log };
};

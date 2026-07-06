import * as clack from '@clack/prompts';
import { Data, Effect } from 'effect';
import pc from 'picocolors';

export class Cancelled extends Data.TaggedError('Cancelled') {}

export interface PromptOption<T> {
  readonly value: T;
  readonly label: string;
  readonly hint?: string;
}

export interface SelectParams<T> {
  readonly message: string;
  readonly options: readonly PromptOption<T>[];
}

export interface MultiselectParams<T> extends SelectParams<T> {
  readonly required?: boolean;
}

export interface SpinnerHandle {
  readonly stop: (message: string) => Effect.Effect<void>;
}

const guardCancel = <T>(make: () => Promise<T | symbol>): Effect.Effect<T, Cancelled> =>
  Effect.promise(make).pipe(
    Effect.filterOrFail(
      (result): result is T => typeof result !== 'symbol',
      () => new Cancelled(),
    ),
  );

/**
 * All terminal interaction (prompts, spinners, log messages). Commands never
 * touch @clack/prompts directly, so tests can script answers and capture output.
 */
export class Prompter extends Effect.Service<Prompter>()('cli/Prompter', {
  succeed: {
    intro: (message: string): Effect.Effect<void> => Effect.sync(() => clack.intro(message)),
    outro: (message: string): Effect.Effect<void> => Effect.sync(() => clack.outro(message)),
    warn: (message: string): Effect.Effect<void> => Effect.sync(() => clack.log.warn(message)),
    error: (message: string): Effect.Effect<void> => Effect.sync(() => clack.log.error(message)),
    debug: (message: string): Effect.Effect<void> =>
      Effect.sync(() => clack.log.message(pc.dim(message))),
    select: <T>(params: SelectParams<T>): Effect.Effect<T, Cancelled> =>
      guardCancel(() =>
        clack.select<T>({
          message: params.message,
          // PromptOption always carries a label, which satisfies both branches of
          // clack's conditional Option<T> type; the cast is needed while T is unresolved.
          options: [...params.options] as clack.Option<T>[],
        }),
      ),
    multiselect: <T>(params: MultiselectParams<T>): Effect.Effect<T[], Cancelled> =>
      guardCancel(() =>
        clack.multiselect<T>({
          message: params.message,
          options: [...params.options] as clack.Option<T>[],
          required: params.required ?? false,
        }),
      ),
    spinner: (message: string): Effect.Effect<SpinnerHandle> =>
      Effect.sync(() => {
        const s = clack.spinner();
        s.start(message);
        return {
          stop: (stopMessage: string) => Effect.sync(() => s.stop(stopMessage)),
        };
      }),
  },
}) {}

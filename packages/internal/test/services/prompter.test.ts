import { describe, expect, it } from '@effect/vitest';
import { Effect } from 'effect';
import { vi } from 'vitest';

import { Prompter } from '../../src/services/prompter.ts';

const clack = vi.hoisted(() => ({
  intro: vi.fn(),
  outro: vi.fn(),
  log: { warn: vi.fn(), error: vi.fn(), info: vi.fn(), message: vi.fn() },
  text: vi.fn(),
  confirm: vi.fn(),
  select: vi.fn(),
  multiselect: vi.fn(),
  spinner: vi.fn(),
}));

vi.mock('@clack/prompts', () => clack);

const CANCEL = Symbol('clack:cancel');

const withLive = <A, E>(effect: Effect.Effect<A, E, Prompter>) =>
  effect.pipe(Effect.provide(Prompter.Default));

describe('Prompter (live)', () => {
  it.effect('forwards intro, outro, info, warn, and error to clack', () =>
    withLive(
      Effect.gen(function* () {
        const prompter = yield* Prompter;
        yield* prompter.intro('hello');
        yield* prompter.outro('bye');
        yield* prompter.info('note');
        yield* prompter.warn('careful');
        yield* prompter.error('boom');
        expect(clack.intro).toHaveBeenCalledWith('hello');
        expect(clack.outro).toHaveBeenCalledWith('bye');
        expect(clack.log.info).toHaveBeenCalledWith('note');
        expect(clack.log.warn).toHaveBeenCalledWith('careful');
        expect(clack.log.error).toHaveBeenCalledWith('boom');
      }),
    ),
  );

  it.effect('prints raw messages through clack.log.message', () =>
    withLive(
      Effect.gen(function* () {
        const prompter = yield* Prompter;
        yield* prompter.message('plan summary');
        expect(clack.log.message).toHaveBeenCalledWith('plan summary');
      }),
    ),
  );

  it.effect('logs debug messages dimmed', () =>
    withLive(
      Effect.gen(function* () {
        const prompter = yield* Prompter;
        yield* prompter.debug('spawning git');
        expect(clack.log.message).toHaveBeenCalledWith(expect.stringContaining('spawning git'));
      }),
    ),
  );

  it.effect('text passes params through and returns the answer', () =>
    withLive(
      Effect.gen(function* () {
        clack.text.mockResolvedValueOnce('my-app');
        const validate = (value: string) => (value === '' ? 'required' : undefined);
        const prompter = yield* Prompter;
        const answer = yield* prompter.text({
          message: 'Project name?',
          defaultValue: 'app',
          validate,
        });
        expect(answer).toBe('my-app');
        expect(clack.text).toHaveBeenCalledWith(
          expect.objectContaining({ message: 'Project name?', defaultValue: 'app', validate }),
        );
      }),
    ),
  );

  it.effect('text fails with Cancelled when the prompt is aborted', () =>
    withLive(
      Effect.gen(function* () {
        clack.text.mockResolvedValueOnce(CANCEL);
        const prompter = yield* Prompter;
        const error = yield* Effect.flip(prompter.text({ message: 'Project name?' }));
        expect(error._tag).toBe('Cancelled');
      }),
    ),
  );

  it.effect('confirm defaults initialValue to true and returns the answer', () =>
    withLive(
      Effect.gen(function* () {
        clack.confirm.mockResolvedValueOnce(false);
        const prompter = yield* Prompter;
        const answer = yield* prompter.confirm({ message: 'Init git?' });
        expect(answer).toBe(false);
        expect(clack.confirm).toHaveBeenCalledWith({ message: 'Init git?', initialValue: true });
      }),
    ),
  );

  it.effect('confirm passes an explicit initialValue and fails with Cancelled on abort', () =>
    withLive(
      Effect.gen(function* () {
        clack.confirm.mockResolvedValueOnce(CANCEL);
        const prompter = yield* Prompter;
        const error = yield* Effect.flip(
          prompter.confirm({ message: 'Install?', initialValue: false }),
        );
        expect(error._tag).toBe('Cancelled');
        expect(clack.confirm).toHaveBeenCalledWith({ message: 'Install?', initialValue: false });
      }),
    ),
  );

  it.effect('select passes the message and options through and returns the answer', () =>
    withLive(
      Effect.gen(function* () {
        clack.select.mockResolvedValueOnce('medium');
        const prompter = yield* Prompter;
        const answer = yield* prompter.select({
          message: 'How sweet?',
          options: [{ value: 'medium', label: 'medium', hint: 'blocking' }],
        });
        expect(answer).toBe('medium');
        expect(clack.select).toHaveBeenCalledWith({
          message: 'How sweet?',
          options: [{ value: 'medium', label: 'medium', hint: 'blocking' }],
        });
      }),
    ),
  );

  it.effect('select fails with Cancelled when the prompt is aborted', () =>
    withLive(
      Effect.gen(function* () {
        clack.select.mockResolvedValueOnce(CANCEL);
        const prompter = yield* Prompter;
        const error = yield* Effect.flip(prompter.select({ message: 'How sweet?', options: [] }));
        expect(error._tag).toBe('Cancelled');
      }),
    ),
  );

  it.effect('multiselect defaults required to false and returns the answers', () =>
    withLive(
      Effect.gen(function* () {
        clack.multiselect.mockResolvedValueOnce(['oxlint', 'knip']);
        const prompter = yield* Prompter;
        const answers = yield* prompter.multiselect({
          message: 'Toppings?',
          options: [
            { value: 'oxlint', label: 'oxlint' },
            { value: 'knip', label: 'knip' },
          ],
        });
        expect(answers).toEqual(['oxlint', 'knip']);
        expect(clack.multiselect).toHaveBeenCalledWith(
          expect.objectContaining({ message: 'Toppings?', required: false }),
        );
      }),
    ),
  );

  it.effect('multiselect passes required through and fails with Cancelled on abort', () =>
    withLive(
      Effect.gen(function* () {
        clack.multiselect.mockResolvedValueOnce(CANCEL);
        const prompter = yield* Prompter;
        const error = yield* Effect.flip(
          prompter.multiselect({ message: 'Toppings?', options: [], required: true }),
        );
        expect(error._tag).toBe('Cancelled');
        expect(clack.multiselect).toHaveBeenCalledWith(expect.objectContaining({ required: true }));
      }),
    ),
  );

  it.effect('spinner starts on creation and stops with the final message', () =>
    withLive(
      Effect.gen(function* () {
        const start = vi.fn();
        const stop = vi.fn();
        clack.spinner.mockReturnValueOnce({ start, stop });
        const prompter = yield* Prompter;
        const handle = yield* prompter.spinner('Installing...');
        expect(start).toHaveBeenCalledWith('Installing...');
        expect(stop).not.toHaveBeenCalled();
        yield* handle.stop('Installed');
        expect(stop).toHaveBeenCalledWith('Installed');
      }),
    ),
  );
});

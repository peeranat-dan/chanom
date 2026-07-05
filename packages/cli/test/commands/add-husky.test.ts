import { describe, expect, it } from '@effect/vitest';
import { Effect, Layer } from 'effect';

import { apply } from '../../src/commands/add-husky/index.ts';
import { getPackages } from '../../src/commands/add-husky/logic.ts';
import { makeTestRunner } from '../support/command-runner.ts';
import { makeTestFs } from '../support/fs.ts';
import { makeTestPrompter } from '../support/prompter.ts';

describe('logic', () => {
  it('installs husky only when missing', () => {
    expect(getPackages({})).toEqual(['husky']);
    expect(getPackages({ devDependencies: { husky: '9.0.0' } })).toEqual([]);
  });
});

describe('apply', () => {
  it.effect('runs husky init through the package manager', () => {
    const fs = makeTestFs();
    const prompter = makeTestPrompter();
    const runner = makeTestRunner();
    return Effect.gen(function* () {
      yield* apply('/project', 'npm');
      expect(runner.calls).toEqual([
        { cmd: 'npx', args: ['--no', '--', 'husky', 'init'], cwd: '/project' },
      ]);
    }).pipe(Effect.provide(Layer.mergeAll(fs.layer, prompter.layer, runner.layer)));
  });

  it.effect('skips init and warns when .husky already exists', () => {
    const fs = makeTestFs({}, ['/project/.husky']);
    const prompter = makeTestPrompter();
    const runner = makeTestRunner();
    return Effect.gen(function* () {
      yield* apply('/project', 'pnpm');
      expect(runner.calls).toEqual([]);
      expect(prompter.log.warnings).toEqual(['`.husky` already exists - skipping husky init']);
    }).pipe(Effect.provide(Layer.mergeAll(fs.layer, prompter.layer, runner.layer)));
  });

  it.effect('fails with HuskyInitFailed when the init command fails', () => {
    const fs = makeTestFs();
    const prompter = makeTestPrompter();
    const runner = makeTestRunner(() => ({ exitCode: 2, stdout: '', stderr: '' }));
    return Effect.gen(function* () {
      const error = yield* Effect.flip(apply('/project', 'pnpm'));
      expect(error._tag).toBe('HuskyInitFailed');
      expect(error).toMatchObject({ exitCode: 2 });
    }).pipe(Effect.provide(Layer.mergeAll(fs.layer, prompter.layer, runner.layer)));
  });
});

import { describe, expect, it } from '@effect/vitest';
import { Effect } from 'effect';

import { run } from '../src/cli.ts';
import { makeTestEnv } from './support/env.ts';

describe('run', () => {
  it.effect('reports unknown commands and exits with 1', () => {
    const env = makeTestEnv();
    return Effect.gen(function* () {
      const exitCode = yield* run('teanom', '/project');
      expect(exitCode).toBe(1);
      expect(env.prompter.log.errors).toEqual([
        'Unknown command: teanom\nAvailable commands: brew',
      ]);
    }).pipe(Effect.provide(env.layer));
  });

  it.effect('reports a missing command as (none)', () => {
    const env = makeTestEnv();
    return Effect.gen(function* () {
      const exitCode = yield* run(undefined, '/project');
      expect(exitCode).toBe(1);
      expect(env.prompter.log.errors[0]).toContain('Unknown command: (none)');
    }).pipe(Effect.provide(env.layer));
  });

  it.effect('exits with 0 when the user cancels a prompt', () => {
    const env = makeTestEnv({
      files: { '/project/package.json': '{}' },
      dirs: ['/project/.git'],
    });
    return Effect.gen(function* () {
      const exitCode = yield* run('brew', '/project');
      expect(exitCode).toBe(0);
      expect(env.prompter.log.errors).toEqual([]);
    }).pipe(Effect.provide(env.layer));
  });

  it.effect('reports a missing package.json and exits with 1', () => {
    const env = makeTestEnv({ dirs: ['/project/.git'] });
    return Effect.gen(function* () {
      const exitCode = yield* run('brew', '/project');
      expect(exitCode).toBe(1);
      expect(env.prompter.log.errors).toEqual([
        'No package.json found in /project. Run this inside a project.',
      ]);
    }).pipe(Effect.provide(env.layer));
  });

  it.effect('reports a failed install and exits with 1', () => {
    const env = makeTestEnv({
      files: { '/project/package.json': '{}' },
      dirs: ['/project/.git'],
      answers: {
        'Which toppings would you like?': ['oxlint'],
        'How sweet would you like it?': 'light',
      },
      commands: ({ cmd }) =>
        cmd === 'pnpm'
          ? { exitCode: 1, stdout: '', stderr: '' }
          : { exitCode: 0, stdout: '', stderr: '' },
    });
    return Effect.gen(function* () {
      const exitCode = yield* run('brew', '/project');
      expect(exitCode).toBe(1);
      expect(env.prompter.log.errors).toEqual(['Package installation with pnpm failed.']);
      expect(env.prompter.log.spinners).toContainEqual(
        expect.objectContaining({ stop: expect.stringContaining('installation failed') }),
      );
    }).pipe(Effect.provide(env.layer));
  });

  const failingInstallEnv = () =>
    makeTestEnv({
      files: { '/project/package.json': '{}' },
      dirs: ['/project/.git'],
      answers: {
        'Which toppings would you like?': ['oxlint'],
        'How sweet would you like it?': 'light',
      },
      commands: ({ cmd }) =>
        cmd === 'pnpm'
          ? { exitCode: 1, stdout: '', stderr: '' }
          : { exitCode: 0, stdout: '', stderr: '' },
    });

  it.effect('with --debug, prints a failure trace naming the failing step', () => {
    const env = failingInstallEnv();
    return Effect.gen(function* () {
      const exitCode = yield* run('brew', '/project', { debug: true });
      expect(exitCode).toBe(1);
      expect(env.prompter.log.debugs).toHaveLength(1);
      const trace = env.prompter.log.debugs[0];
      expect(trace).toContain('InstallFailed');
      expect(trace).toContain('brew.installPackages');
      expect(trace).toContain('at brew');
    }).pipe(Effect.provide(env.layer));
  });

  it.effect('without --debug, prints no failure trace', () => {
    const env = failingInstallEnv();
    return Effect.gen(function* () {
      const exitCode = yield* run('brew', '/project');
      expect(exitCode).toBe(1);
      expect(env.prompter.log.debugs).toEqual([]);
    }).pipe(Effect.provide(env.layer));
  });

  it.effect('with --debug, prompt cancellation prints no failure trace', () => {
    const env = makeTestEnv({
      files: { '/project/package.json': '{}' },
      dirs: ['/project/.git'],
    });
    return Effect.gen(function* () {
      const exitCode = yield* run('brew', '/project', { debug: true });
      expect(exitCode).toBe(0);
      expect(env.prompter.log.debugs).toEqual([]);
    }).pipe(Effect.provide(env.layer));
  });
});

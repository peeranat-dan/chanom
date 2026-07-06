import { describe, expect, it } from '@effect/vitest';
import { Effect, Layer } from 'effect';

import { Git } from '../../src/services/git.ts';
import { type CommandHandler, makeTestRunner } from '../support/command-runner.ts';
import { makeTestFs, type TestFs } from '../support/fs.ts';

const makeGitLayer = (handler?: CommandHandler, fs: TestFs = makeTestFs()) => {
  const runner = makeTestRunner(handler);
  const layer = Git.Default.pipe(Layer.provide(Layer.mergeAll(runner.layer, fs.layer)));
  return { layer, runner, fs };
};

describe('Git', () => {
  it.effect('commit runs git commit and maps the exit code to ok', () => {
    const { layer, runner } = makeGitLayer(({ args }) =>
      args[0] === 'commit'
        ? { exitCode: 1, stdout: '', stderr: 'nothing to commit' }
        : { exitCode: 0, stdout: '', stderr: '' },
    );
    return Effect.gen(function* () {
      const git = yield* Git;
      const result = yield* git.commit('/project', 'feat: hello');
      expect(result).toEqual({ ok: false, stdout: '', stderr: 'nothing to commit' });
      expect(runner.calls).toEqual([
        { cmd: 'git', args: ['commit', '-m', 'feat: hello'], cwd: '/project' },
      ]);
    }).pipe(Effect.provide(layer));
  });

  it.effect('hasStagedChanges is true when git diff --cached exits non-zero', () => {
    const { layer } = makeGitLayer(() => ({ exitCode: 1, stdout: '', stderr: '' }));
    return Effect.gen(function* () {
      const git = yield* Git;
      expect(yield* git.hasStagedChanges('/project')).toBe(true);
    }).pipe(Effect.provide(layer));
  });

  it.effect('hasStagedChanges is false when the staging area is clean', () => {
    const { layer, runner } = makeGitLayer();
    return Effect.gen(function* () {
      const git = yield* Git;
      expect(yield* git.hasStagedChanges('/project')).toBe(false);
      expect(runner.calls).toEqual([
        { cmd: 'git', args: ['diff', '--cached', '--quiet'], cwd: '/project' },
      ]);
    }).pipe(Effect.provide(layer));
  });

  it.effect('setLocalIdentity sets user.name and user.email', () => {
    const { layer, runner } = makeGitLayer();
    return Effect.gen(function* () {
      const git = yield* Git;
      yield* git.setLocalIdentity('/project', 'Chanom', 'chanom@local');
      expect(runner.calls).toEqual([
        { cmd: 'git', args: ['config', 'user.name', 'Chanom'], cwd: '/project' },
        { cmd: 'git', args: ['config', 'user.email', 'chanom@local'], cwd: '/project' },
      ]);
    }).pipe(Effect.provide(layer));
  });

  it.effect('isRepo checks for a .git directory', () => {
    const { layer } = makeGitLayer(undefined, makeTestFs({}, ['/project/.git']));
    return Effect.gen(function* () {
      const git = yield* Git;
      expect(yield* git.isRepo('/project')).toBe(true);
      expect(yield* git.isRepo('/elsewhere')).toBe(false);
    }).pipe(Effect.provide(layer));
  });

  it.effect('writeGitignore writes the default contents', () => {
    const fs = makeTestFs();
    const { layer } = makeGitLayer(undefined, fs);
    return Effect.gen(function* () {
      const git = yield* Git;
      yield* git.writeGitignore('/project');
      expect(fs.files.get('/project/.gitignore')).toBe('node_modules\n');
    }).pipe(Effect.provide(layer));
  });
});

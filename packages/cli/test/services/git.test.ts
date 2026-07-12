import { describe, expect, it } from '@effect/vitest';
import { Effect, Layer, Option } from 'effect';

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

  it.effect('isRepo asks git whether cwd is inside a work tree', () => {
    const { layer, runner } = makeGitLayer(({ cwd }) =>
      cwd === '/project' || cwd === '/project/packages/app'
        ? { exitCode: 0, stdout: 'true', stderr: '' }
        : { exitCode: 128, stdout: '', stderr: 'fatal: not a git repository' },
    );
    return Effect.gen(function* () {
      const git = yield* Git;
      expect(yield* git.isRepo('/project')).toBe(true);
      // Subdirectories of a repo count as inside it - no nested `git init`.
      expect(yield* git.isRepo('/project/packages/app')).toBe(true);
      expect(yield* git.isRepo('/elsewhere')).toBe(false);
      expect(runner.calls[0]).toEqual({
        cmd: 'git',
        args: ['rev-parse', '--is-inside-work-tree'],
        cwd: '/project',
      });
    }).pipe(Effect.provide(layer));
  });

  it.effect('prefix is the path relative to the work-tree root', () => {
    const { layer, runner } = makeGitLayer(({ cwd }) => ({
      exitCode: 0,
      stdout: cwd === '/project' ? '' : 'packages/app/',
      stderr: '',
    }));
    return Effect.gen(function* () {
      const git = yield* Git;
      expect(yield* git.prefix('/project')).toEqual(Option.some(''));
      expect(yield* git.prefix('/project/packages/app')).toEqual(Option.some('packages/app/'));
      expect(runner.calls[0]).toEqual({
        cmd: 'git',
        args: ['rev-parse', '--show-prefix'],
        cwd: '/project',
      });
    }).pipe(Effect.provide(layer));
  });

  it.effect('prefix is None outside a repository', () => {
    const { layer } = makeGitLayer(() => ({ exitCode: 128, stdout: '', stderr: 'fatal' }));
    return Effect.gen(function* () {
      const git = yield* Git;
      expect(yield* git.prefix('/elsewhere')).toEqual(Option.none());
    }).pipe(Effect.provide(layer));
  });

  it.effect('root is the absolute work-tree root, None outside a repository', () => {
    const { layer, runner } = makeGitLayer(({ cwd }) =>
      cwd.startsWith('/project')
        ? { exitCode: 0, stdout: '/project', stderr: '' }
        : { exitCode: 128, stdout: '', stderr: 'fatal' },
    );
    return Effect.gen(function* () {
      const git = yield* Git;
      expect(yield* git.root('/project/packages/app')).toEqual(Option.some('/project'));
      expect(yield* git.root('/elsewhere')).toEqual(Option.none());
      expect(runner.calls[0]).toEqual({
        cmd: 'git',
        args: ['rev-parse', '--show-toplevel'],
        cwd: '/project/packages/app',
      });
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

  it.effect('readGitignore reads the .gitignore contents', () => {
    const fs = makeTestFs({ '/project/.gitignore': 'dist\n' });
    const { layer } = makeGitLayer(undefined, fs);
    return Effect.gen(function* () {
      const git = yield* Git;
      expect(yield* git.readGitignore('/project')).toBe('dist\n');
    }).pipe(Effect.provide(layer));
  });

  it.effect('readGitignore fails with NotFound when .gitignore is missing', () => {
    const { layer } = makeGitLayer();
    return Effect.gen(function* () {
      const git = yield* Git;
      const error = yield* Effect.flip(git.readGitignore('/project'));
      expect(error._tag).toBe('SystemError');
      expect(error._tag === 'SystemError' && error.reason).toBe('NotFound');
    }).pipe(Effect.provide(layer));
  });
});

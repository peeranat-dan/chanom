import { describe, expect, it } from '@effect/vitest';
import { Effect } from 'effect';

import { run } from '../src/cli.ts';
import { makeEnv, TEMPLATE_ROOT } from './support/env.ts';

const opts = { templatesRoot: TEMPLATE_ROOT, userAgent: 'pnpm/11.9.0 npm/? node/v22' };

const pkgAt = (files: Map<string, string>, path: string) =>
  JSON.parse(files.get(path) ?? '{}') as Record<string, unknown>;

describe('run', () => {
  it.effect('scaffolds into the target dir with --yes and records the launcher PM', () => {
    const { fs, runner, layer } = makeEnv();
    return Effect.gen(function* () {
      const code = yield* run(['demo', '--yes', '--no-install'], '/work', opts);
      expect(code).toBe(0);
      expect(fs.files.has('/work/demo/package.json')).toBe(true);
      expect(pkgAt(fs.files, '/work/demo/package.json').packageManager).toBe('pnpm@11.9.0');
      // --yes turns git on.
      expect(runner.calls.some((c) => c.cmd === 'git' && c.args[0] === 'init')).toBe(true);
    }).pipe(Effect.provide(layer));
  });

  it.effect('uses the default name with --yes and no directory', () => {
    const { fs, layer } = makeEnv();
    return Effect.gen(function* () {
      const code = yield* run(['--yes', '--no-install'], '/work', opts);
      expect(code).toBe(0);
      expect(fs.files.has('/work/my-chanom-app/package.json')).toBe(true);
    }).pipe(Effect.provide(layer));
  });

  it.effect('scaffolds into the current directory for "."', () => {
    const { fs, prompter, layer } = makeEnv();
    return Effect.gen(function* () {
      const code = yield* run(['.', '--yes', '--no-install', '--no-git'], '/work', opts);
      expect(code).toBe(0);
      expect(fs.files.has('/work/package.json')).toBe(true);
      // The outro omits `cd .`.
      expect(prompter.log.outros.some((o) => o.includes('cd .'))).toBe(false);
    }).pipe(Effect.provide(layer));
  });

  it.effect('resolves the interactive name and confirm prompts', () => {
    const { fs, layer } = makeEnv({
      answers: {
        'Project name?': 'my-app',
        'Initialize a git repository?': false,
        'Install dependencies now?': false,
      },
    });
    return Effect.gen(function* () {
      const code = yield* run([], '/work', opts);
      expect(code).toBe(0);
      expect(fs.files.has('/work/my-app/package.json')).toBe(true);
    }).pipe(Effect.provide(layer));
  });

  it.effect('asks for commit hooks only when git is on', () => {
    const { fs, layer } = makeEnv({
      answers: {
        'Project name?': 'my-app',
        'Initialize a git repository?': true,
        'Add commit hooks (husky + lint-staged + commitlint)?': true,
        'Install dependencies now?': false,
      },
    });
    return Effect.gen(function* () {
      yield* run([], '/work', opts);
      expect(fs.files.has('/work/my-app/.husky/commit-msg')).toBe(true);
    }).pipe(Effect.provide(layer));
  });

  it.effect('never writes hooks when git is declined (prompt is gated)', () => {
    const { fs, layer } = makeEnv({
      answers: {
        'Project name?': 'my-app',
        'Initialize a git repository?': false,
        'Install dependencies now?': false,
      },
    });
    return Effect.gen(function* () {
      yield* run([], '/work', opts);
      expect(fs.files.has('/work/my-app/.husky/commit-msg')).toBe(false);
    }).pipe(Effect.provide(layer));
  });

  it.effect('honors --pm and omits packageManager when it differs from the launcher', () => {
    const { fs, layer } = makeEnv();
    return Effect.gen(function* () {
      yield* run(['demo', '--yes', '--no-install', '--pm', 'npm'], '/work', opts);
      expect(pkgAt(fs.files, '/work/demo/package.json').packageManager).toBeUndefined();
    }).pipe(Effect.provide(layer));
  });

  it.effect('aborts on a non-empty target directory', () => {
    const { fs, layer } = makeEnv({ files: { '/work/demo/keep.txt': 'x' } });
    return Effect.gen(function* () {
      const code = yield* run(['demo', '--yes', '--no-install'], '/work', opts);
      expect(code).toBe(1);
      expect(fs.files.has('/work/demo/package.json')).toBe(false);
    }).pipe(Effect.provide(layer));
  });

  it.effect('treats a lone .git as an empty directory', () => {
    const { fs, layer } = makeEnv({ files: { '/work/demo/.git/HEAD': 'ref' } });
    return Effect.gen(function* () {
      const code = yield* run(['demo', '--yes', '--no-install', '--no-git'], '/work', opts);
      expect(code).toBe(0);
      expect(fs.files.has('/work/demo/package.json')).toBe(true);
    }).pipe(Effect.provide(layer));
  });

  it.effect('rejects the contradictory --no-git --commit-hooks pair', () => {
    const { layer } = makeEnv();
    return Effect.gen(function* () {
      expect(yield* run(['--no-git', '--commit-hooks'], '/work', opts)).toBe(1);
    }).pipe(Effect.provide(layer));
  });

  it.effect('rejects an unknown option', () => {
    const { layer } = makeEnv();
    return Effect.gen(function* () {
      expect(yield* run(['--nope'], '/work', opts)).toBe(1);
    }).pipe(Effect.provide(layer));
  });

  it.effect('rejects an invalid directory passed as an argument', () => {
    const { layer } = makeEnv();
    return Effect.gen(function* () {
      expect(yield* run(['.hidden', '--yes'], '/work', opts)).toBe(1);
    }).pipe(Effect.provide(layer));
  });

  it.effect('prints help and exits 0', () => {
    const { prompter, layer } = makeEnv();
    return Effect.gen(function* () {
      expect(yield* run(['--help'], '/work', opts)).toBe(0);
      expect(prompter.log.messages.some((m) => m.includes('create-chanom-app'))).toBe(true);
    }).pipe(Effect.provide(layer));
  });

  it.effect('prints the version and exits 0', () => {
    const { prompter, layer } = makeEnv();
    return Effect.gen(function* () {
      expect(yield* run(['--version'], '/work', opts)).toBe(0);
      expect(prompter.log.messages).toContain('0.0.0-test');
    }).pipe(Effect.provide(layer));
  });

  it.effect('exits 0 when a prompt is cancelled', () => {
    const { layer } = makeEnv({ answers: {} });
    return Effect.gen(function* () {
      expect(yield* run([], '/work', opts)).toBe(0);
    }).pipe(Effect.provide(layer));
  });

  it.effect('returns 1 when installation fails', () => {
    const { layer } = makeEnv({
      commands: ({ cmd }) =>
        cmd === 'pnpm'
          ? { exitCode: 1, stdout: '', stderr: '' }
          : { exitCode: 0, stdout: '', stderr: '' },
    });
    return Effect.gen(function* () {
      expect(yield* run(['demo', '--yes'], '/work', opts)).toBe(1);
    }).pipe(Effect.provide(layer));
  });

  it.effect('falls back to pnpm and no packageManager field without a user agent', () => {
    const { fs, layer } = makeEnv();
    return Effect.gen(function* () {
      yield* run(['demo', '--yes', '--no-install'], '/work', { templatesRoot: TEMPLATE_ROOT });
      const pkg = pkgAt(fs.files, '/work/demo/package.json');
      expect(pkg.packageManager).toBeUndefined();
    }).pipe(Effect.provide(layer));
  });
});

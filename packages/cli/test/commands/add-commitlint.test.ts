import { describe, expect, it } from '@effect/vitest';
import { Effect, Layer } from 'effect';

import { apply } from '../../src/commands/add-commitlint/index.ts';
import { commitMsgHook, getPackages } from '../../src/commands/add-commitlint/logic.ts';
import { makeTestFs } from '../support/fs.ts';
import { makeTestPrompter } from '../support/prompter.ts';

describe('logic', () => {
  it('installs only the missing commitlint packages', () => {
    expect(getPackages({})).toEqual(['@commitlint/cli', '@commitlint/config-conventional']);
    expect(getPackages({ devDependencies: { '@commitlint/cli': '21.0.0' } })).toEqual([
      '@commitlint/config-conventional',
    ]);
  });

  it('builds the commit-msg hook for each package manager', () => {
    expect(commitMsgHook('pnpm')).toBe('pnpm exec commitlint --edit $1\n');
    expect(commitMsgHook('npm')).toBe('npx --no -- commitlint --edit $1\n');
  });
});

describe('apply', () => {
  it.effect('writes the config and the commit-msg hook when .husky exists', () => {
    const fs = makeTestFs({}, ['/project/.husky']);
    const prompter = makeTestPrompter();
    return Effect.gen(function* () {
      yield* apply('/project', 'pnpm');
      expect(JSON.parse(fs.files.get('/project/.commitlintrc.json') ?? '')).toEqual({
        extends: ['@commitlint/config-conventional'],
      });
      expect(fs.files.get('/project/.husky/commit-msg')).toBe('pnpm exec commitlint --edit $1\n');
    }).pipe(Effect.provide(Layer.mergeAll(fs.layer, prompter.layer)));
  });

  it.effect('keeps existing config and hook, warning for each', () => {
    const fs = makeTestFs({
      '/project/commitlint.config.js': 'export default {};\n',
      '/project/.husky/commit-msg': 'echo custom\n',
    });
    const prompter = makeTestPrompter();
    return Effect.gen(function* () {
      yield* apply('/project', 'pnpm');
      expect(fs.files.has('/project/.commitlintrc.json')).toBe(false);
      expect(fs.files.get('/project/.husky/commit-msg')).toBe('echo custom\n');
      expect(prompter.log.warnings).toEqual([
        '`commitlint.config.js` already exists - skipping commitlint config',
        '`.husky/commit-msg` already exists - skipping',
      ]);
    }).pipe(Effect.provide(Layer.mergeAll(fs.layer, prompter.layer)));
  });
});

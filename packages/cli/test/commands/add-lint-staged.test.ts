import { describe, expect, it } from '@effect/vitest';
import { Effect, Layer } from 'effect';

import { apply } from '../../src/commands/add-lint-staged/index.ts';
import { buildConfig, getPackages } from '../../src/commands/add-lint-staged/logic.ts';
import { makeTestFs } from '../support/fs.ts';
import { makeTestPrompter } from '../support/prompter.ts';

const jsGlob = '**/*.{js,jsx,ts,tsx,mjs,cjs,mts,cts}';

describe('logic', () => {
  it('installs lint-staged only when missing', () => {
    expect(getPackages({})).toEqual(['lint-staged']);
    expect(getPackages({ devDependencies: { 'lint-staged': '17.0.0' } })).toEqual([]);
  });

  it('builds a config for the selected linters and formatters', () => {
    expect(buildConfig(['oxlint'], ['oxfmt'])).toEqual({
      [jsGlob]: ['oxlint --fix --no-error-on-unmatched-pattern'],
      '*': ['oxfmt --no-error-on-unmatched-pattern'],
    });
    expect(buildConfig([], [])).toEqual({});
  });
});

describe('apply', () => {
  it.effect('writes neither config nor hook when nothing is selected', () => {
    const fs = makeTestFs({}, ['/project/.husky']);
    const prompter = makeTestPrompter();
    return Effect.gen(function* () {
      yield* apply('/project', [], []);
      expect(fs.files.has('/project/.lintstagedrc.json')).toBe(false);
      expect(fs.files.has('/project/.husky/pre-commit')).toBe(false);
    }).pipe(Effect.provide(Layer.mergeAll(fs.layer, prompter.layer)));
  });

  it.effect('writes the config and the pre-commit hook when .husky exists', () => {
    const fs = makeTestFs({}, ['/project/.husky']);
    const prompter = makeTestPrompter();
    return Effect.gen(function* () {
      yield* apply('/project', ['oxlint'], ['oxfmt']);
      expect(JSON.parse(fs.files.get('/project/.lintstagedrc.json') ?? '')).toEqual(
        buildConfig(['oxlint'], ['oxfmt']),
      );
      expect(fs.files.get('/project/.husky/pre-commit')).toBe('lint-staged\n');
    }).pipe(Effect.provide(Layer.mergeAll(fs.layer, prompter.layer)));
  });

  it.effect('does not touch hooks when .husky is absent', () => {
    const fs = makeTestFs();
    const prompter = makeTestPrompter();
    return Effect.gen(function* () {
      yield* apply('/project', ['oxlint'], []);
      expect(fs.files.has('/project/.husky/pre-commit')).toBe(false);
    }).pipe(Effect.provide(Layer.mergeAll(fs.layer, prompter.layer)));
  });

  it.effect('keeps an existing pre-commit hook unless overwrite is requested', () => {
    const fs = makeTestFs({ '/project/.husky/pre-commit': 'echo custom\n' });
    const prompter = makeTestPrompter();
    return Effect.gen(function* () {
      yield* apply('/project', ['oxlint'], []);
      expect(fs.files.get('/project/.husky/pre-commit')).toBe('echo custom\n');
      expect(prompter.log.warnings).toContain('`.husky/pre-commit` already exists - skipping');
    }).pipe(Effect.provide(Layer.mergeAll(fs.layer, prompter.layer)));
  });

  it.effect('overwrites the pre-commit hook when overwrite is requested', () => {
    const fs = makeTestFs({ '/project/.husky/pre-commit': 'echo custom\n' });
    const prompter = makeTestPrompter();
    return Effect.gen(function* () {
      yield* apply('/project', ['oxlint'], [], true);
      expect(fs.files.get('/project/.husky/pre-commit')).toBe('lint-staged\n');
    }).pipe(Effect.provide(Layer.mergeAll(fs.layer, prompter.layer)));
  });

  it.effect('skips the config when one already exists', () => {
    const fs = makeTestFs({ '/project/.lintstagedrc.json': '{}' });
    const prompter = makeTestPrompter();
    return Effect.gen(function* () {
      yield* apply('/project', ['oxlint'], []);
      expect(fs.files.get('/project/.lintstagedrc.json')).toBe('{}');
      expect(prompter.log.warnings).toContain(
        '`.lintstagedrc.json` already exists - skipping lint-staged config',
      );
    }).pipe(Effect.provide(Layer.mergeAll(fs.layer, prompter.layer)));
  });
});

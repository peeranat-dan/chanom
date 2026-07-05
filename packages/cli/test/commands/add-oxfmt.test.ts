import { describe, expect, it } from '@effect/vitest';
import { Effect, Layer } from 'effect';

import { apply } from '../../src/commands/add-oxfmt/index.ts';
import { configFile, getPackages, getScriptPlan } from '../../src/commands/add-oxfmt/logic.ts';
import { makeTestFs } from '../support/fs.ts';
import { makeTestPrompter } from '../support/prompter.ts';

const versions = { oxfmt: '1.0.0', devConfig: '0.0.3' };

describe('logic', () => {
  it('requests packages that are missing or mismatched', () => {
    expect(getPackages({}, versions)).toEqual(['oxfmt@1.0.0', '@chanom/dev-config@0.0.3']);
    expect(
      getPackages(
        { devDependencies: { oxfmt: '^1.0.0', '@chanom/dev-config': '0.0.3' } },
        versions,
      ),
    ).toEqual([]);
  });

  it('plans format scripts', () => {
    expect(getScriptPlan(undefined).scripts).toEqual({
      format: 'oxfmt',
      'format:check': 'oxfmt --check',
    });
  });

  it('picks the config extension based on the module system', () => {
    expect(configFile(false).fileName).toBe('oxfmt.config.mts');
  });
});

describe('apply', () => {
  it.effect('writes the config file and adds scripts', () => {
    const fs = makeTestFs();
    const prompter = makeTestPrompter();
    return Effect.gen(function* () {
      const updated = yield* apply('/project', false, {});
      expect(fs.files.get('/project/oxfmt.config.mts')).toBe(
        `export { default } from '@chanom/dev-config/oxfmt/config';\n`,
      );
      expect(updated.scripts).toEqual({ format: 'oxfmt', 'format:check': 'oxfmt --check' });
    }).pipe(Effect.provide(Layer.mergeAll(fs.layer, prompter.layer)));
  });

  it.effect('warns and skips when a config already exists', () => {
    const fs = makeTestFs({ '/project/oxfmt.config.js': '' });
    const prompter = makeTestPrompter();
    return Effect.gen(function* () {
      yield* apply('/project', true, {});
      expect(prompter.log.warnings).toContain(
        '`oxfmt.config.js` already exists - skipping oxfmt config',
      );
    }).pipe(Effect.provide(Layer.mergeAll(fs.layer, prompter.layer)));
  });
});

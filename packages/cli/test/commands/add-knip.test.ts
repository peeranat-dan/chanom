import { describe, expect, it } from '@effect/vitest';
import { Effect, Layer } from 'effect';

import { apply } from '../../src/commands/add-knip/index.ts';
import { getPackages, getScriptPlan } from '../../src/commands/add-knip/logic.ts';
import { makeTestFs } from '../support/fs.ts';
import { makeTestPrompter } from '../support/prompter.ts';

const versions = { knip: '6.0.0', devConfig: '0.0.3' };

describe('logic', () => {
  it('installs pinned knip and dev-config only when knip is missing', () => {
    expect(getPackages({}, versions)).toEqual(['knip@6.0.0', '@chanom/dev-config@0.0.3']);
    expect(getPackages({ devDependencies: { knip: '5.0.0' } }, versions)).toEqual([]);
  });

  it('plans the knip script', () => {
    expect(getScriptPlan(undefined).scripts).toEqual({ knip: 'knip' });
  });
});

describe('apply', () => {
  it.effect('writes the config file and adds the script', () => {
    const fs = makeTestFs();
    const prompter = makeTestPrompter();
    return Effect.gen(function* () {
      const updated = yield* apply('/project', true, {});
      expect(fs.files.get('/project/knip.config.ts')).toBe(
        `export { default } from '@chanom/dev-config/knip/config';\n`,
      );
      expect(updated.scripts).toEqual({ knip: 'knip' });
    }).pipe(Effect.provide(Layer.mergeAll(fs.layer, prompter.layer)));
  });

  it.effect('warns and skips when a config already exists', () => {
    const fs = makeTestFs({ '/project/knip.json': '{}' });
    const prompter = makeTestPrompter();
    return Effect.gen(function* () {
      yield* apply('/project', true, {});
      expect(fs.files.has('/project/knip.config.ts')).toBe(false);
      expect(prompter.log.warnings).toContain('`knip.json` already exists - skipping knip config');
    }).pipe(Effect.provide(Layer.mergeAll(fs.layer, prompter.layer)));
  });

  it.effect('keeps an existing knip script and warns about it', () => {
    const fs = makeTestFs();
    const prompter = makeTestPrompter();
    return Effect.gen(function* () {
      const pkg = { scripts: { knip: 'knip --production' } };
      const updated = yield* apply('/project', true, pkg);
      expect(updated.scripts).toEqual(pkg.scripts);
      expect(prompter.log.warnings).toEqual([
        '`knip` script already exists in package.json - skipping',
      ]);
    }).pipe(Effect.provide(Layer.mergeAll(fs.layer, prompter.layer)));
  });
});

import { describe, expect, it } from '@effect/vitest';
import { Effect, Layer } from 'effect';

import { apply } from '../../src/commands/add-oxlint/index.ts';
import { configFile, getPackages, getScriptPlan } from '../../src/commands/add-oxlint/logic.ts';
import { makeTestFs } from '../support/fs.ts';
import { makeTestPrompter } from '../support/prompter.ts';

const versions = { oxlint: '2.0.0', devConfig: '0.0.3', oxlintTsgolint: '0.24.0' };

describe('logic', () => {
  it('requests packages that are missing or mismatched', () => {
    expect(getPackages({}, versions)).toEqual([
      'oxlint@2.0.0',
      'oxlint-tsgolint@0.24.0',
      '@chanom/dev-config@0.0.3',
    ]);
    expect(
      getPackages(
        {
          devDependencies: {
            oxlint: '2.0.0',
            'oxlint-tsgolint': '0.24.0',
            '@chanom/dev-config': '0.0.3',
          },
        },
        versions,
      ),
    ).toEqual([]);
  });

  it('picks the config extension based on the module system', () => {
    expect(configFile(true).fileName).toBe('oxlint.config.ts');
    expect(configFile(false).fileName).toBe('oxlint.config.mts');
  });

  it('plans lint scripts without overwriting existing ones', () => {
    expect(getScriptPlan(undefined).added).toEqual(['lint', 'lint:fix']);
    expect(getScriptPlan({ lint: 'eslint' }).skipped).toEqual(['lint']);
  });
});

describe('apply', () => {
  it.effect('writes the config file and adds scripts', () => {
    const fs = makeTestFs();
    const prompter = makeTestPrompter();
    return Effect.gen(function* () {
      const updated = yield* apply('/project', true, { type: 'module' });
      expect(fs.files.get('/project/oxlint.config.ts')).toBe(
        `export { default } from '@chanom/dev-config/oxlint/config';\n`,
      );
      expect(updated.scripts).toEqual({ lint: 'oxlint', 'lint:fix': 'oxlint --fix' });
      expect(prompter.log.warnings).toEqual([]);
    }).pipe(Effect.provide(Layer.mergeAll(fs.layer, prompter.layer)));
  });

  it.effect('skips the config file when one already exists and warns', () => {
    const fs = makeTestFs({ '/project/.oxlintrc.json': '{}' });
    const prompter = makeTestPrompter();
    return Effect.gen(function* () {
      yield* apply('/project', true, {});
      expect(fs.files.has('/project/oxlint.config.ts')).toBe(false);
      expect(prompter.log.warnings).toEqual([
        '`.oxlintrc.json` already exists - skipping oxlint config',
      ]);
    }).pipe(Effect.provide(Layer.mergeAll(fs.layer, prompter.layer)));
  });

  it.effect('keeps existing scripts and warns about each skipped one', () => {
    const fs = makeTestFs();
    const prompter = makeTestPrompter();
    return Effect.gen(function* () {
      const pkg = { scripts: { lint: 'eslint .', 'lint:fix': 'eslint --fix .' } };
      const updated = yield* apply('/project', true, pkg);
      expect(updated.scripts).toEqual(pkg.scripts);
      expect(prompter.log.warnings).toEqual([
        '`lint` script already exists in package.json - skipping',
        '`lint:fix` script already exists in package.json - skipping',
      ]);
    }).pipe(Effect.provide(Layer.mergeAll(fs.layer, prompter.layer)));
  });
});

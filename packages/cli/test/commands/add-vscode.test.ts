import { describe, expect, it } from '@effect/vitest';
import { Effect, Layer } from 'effect';

import { apply } from '../../src/commands/add-vscode/index.ts';
import { makeTestFs } from '../support/fs.ts';
import { makeTestPrompter } from '../support/prompter.ts';

const settingsPath = '/project/.vscode/settings.json';
const extensionsPath = '/project/.vscode/extensions.json';

const parse = (contents: string | undefined): Record<string, unknown> =>
  JSON.parse(contents ?? '{}') as Record<string, unknown>;

describe('apply', () => {
  it.effect('writes both files when .vscode does not exist', () => {
    const fs = makeTestFs();
    const prompter = makeTestPrompter();
    return Effect.gen(function* () {
      yield* apply('/project', 'oxfmt.config.ts');

      const settings = parse(fs.files.get(settingsPath));
      expect(settings['editor.defaultFormatter']).toBe('oxc.oxc-vscode');
      expect(settings['oxc.fmt.configPath']).toBe('oxfmt.config.ts');
      expect(parse(fs.files.get(extensionsPath))).toEqual({
        recommendations: ['oxc.oxc-vscode'],
      });
      expect(prompter.log.warnings).toEqual([]);
    }).pipe(Effect.provide(Layer.mergeAll(fs.layer, prompter.layer)));
  });

  it.effect('merges into existing settings without overwriting the user values', () => {
    const fs = makeTestFs({
      [settingsPath]: JSON.stringify({ 'editor.formatOnSave': true, 'files.eol': '\n' }),
    });
    const prompter = makeTestPrompter();
    return Effect.gen(function* () {
      yield* apply('/project', 'oxfmt.config.ts');

      const settings = parse(fs.files.get(settingsPath));
      expect(settings['editor.formatOnSave']).toBe(true);
      expect(settings['files.eol']).toBe('\n');
      expect(settings['oxc.typeAware']).toBe(true);
      expect(prompter.log.warnings).toEqual([
        '`editor.formatOnSave` is already set in .vscode/settings.json - skipping',
      ]);
    }).pipe(Effect.provide(Layer.mergeAll(fs.layer, prompter.layer)));
  });

  it.effect('unions recommendations into an existing extensions.json', () => {
    const fs = makeTestFs({
      [extensionsPath]: JSON.stringify({
        recommendations: ['vercel.turbo-vsc'],
        unwantedRecommendations: ['some.ext'],
      }),
    });
    const prompter = makeTestPrompter();
    return Effect.gen(function* () {
      yield* apply('/project', 'oxfmt.config.ts');

      expect(parse(fs.files.get(extensionsPath))).toEqual({
        recommendations: ['vercel.turbo-vsc', 'oxc.oxc-vscode'],
        unwantedRecommendations: ['some.ext'],
      });
    }).pipe(Effect.provide(Layer.mergeAll(fs.layer, prompter.layer)));
  });

  it.effect('leaves files untouched when everything is already configured', () => {
    const fs = makeTestFs();
    const prompter = makeTestPrompter();
    return Effect.gen(function* () {
      yield* apply('/project', 'oxfmt.config.ts');
      const firstSettings = fs.files.get(settingsPath);
      const firstExtensions = fs.files.get(extensionsPath);

      yield* apply('/project', 'oxfmt.config.ts');
      expect(fs.files.get(settingsPath)).toBe(firstSettings);
      expect(fs.files.get(extensionsPath)).toBe(firstExtensions);
    }).pipe(Effect.provide(Layer.mergeAll(fs.layer, prompter.layer)));
  });

  it.effect('warns and skips a settings.json it cannot parse', () => {
    const fs = makeTestFs({ [settingsPath]: '{ // a comment\n  "a": 1 }' });
    const prompter = makeTestPrompter();
    return Effect.gen(function* () {
      yield* apply('/project', 'oxfmt.config.ts');

      expect(fs.files.get(settingsPath)).toBe('{ // a comment\n  "a": 1 }');
      expect(prompter.log.warnings).toContain(
        '`.vscode/settings.json` could not be parsed (comments?) - skipping settings',
      );
      // extensions.json is independent, so it is still written.
      expect(fs.files.has(extensionsPath)).toBe(true);
    }).pipe(Effect.provide(Layer.mergeAll(fs.layer, prompter.layer)));
  });
});

import { describe, expect, it } from '@effect/vitest';
import { Effect, Option } from 'effect';

import { detectSetupFile } from '../../src/utils/detect-setup.ts';
import { makeTestFs } from '../support/fs.ts';

describe('detectSetupFile', () => {
  it.effect('returns the first matching candidate', () => {
    const fs = makeTestFs({
      '/project/oxlint.config.ts': '',
      '/project/.oxlintrc.json': '',
    });
    return Effect.gen(function* () {
      const found = yield* detectSetupFile('oxlint', '/project');
      expect(found).toEqual(Option.some('/project/oxlint.config.ts'));
    }).pipe(Effect.provide(fs.layer));
  });

  it.effect('detects the .husky directory', () => {
    const fs = makeTestFs({}, ['/project/.husky']);
    return Effect.gen(function* () {
      const found = yield* detectSetupFile('husky', '/project');
      expect(found).toEqual(Option.some('/project/.husky'));
    }).pipe(Effect.provide(fs.layer));
  });

  it.effect('returns none when nothing matches', () => {
    const fs = makeTestFs({ '/project/eslint.config.js': '' });
    return Effect.gen(function* () {
      const found = yield* detectSetupFile('oxlint', '/project');
      expect(Option.isNone(found)).toBe(true);
    }).pipe(Effect.provide(fs.layer));
  });
});

import { describe, expect, it } from '@effect/vitest';
import { Effect } from 'effect';

import { readPkg, writePkg } from '../../src/utils/pkg-file.ts';
import { makeTestFs } from '../support/fs.ts';

describe('readPkg', () => {
  it.effect('reads and parses package.json', () => {
    const fs = makeTestFs({ '/project/package.json': '{"type":"module","scripts":{"a":"b"}}' });
    return Effect.gen(function* () {
      const { pkg, pkgPath } = yield* readPkg('/project');
      expect(pkgPath).toBe('/project/package.json');
      expect(pkg).toEqual({ type: 'module', scripts: { a: 'b' } });
    }).pipe(Effect.provide(fs.layer));
  });

  it.effect('keeps fields outside the Pkg schema', () => {
    const fs = makeTestFs({
      '/project/package.json': '{"name":"app","private":true,"scripts":{"a":"b"}}',
    });
    return Effect.gen(function* () {
      const { pkg } = yield* readPkg('/project');
      expect(pkg).toEqual({ name: 'app', private: true, scripts: { a: 'b' } });
    }).pipe(Effect.provide(fs.layer));
  });

  it.effect("keeps the file's key order", () => {
    const fs = makeTestFs({
      '/project/package.json':
        '{"name":"app","scripts":{"z":"1","a":"2"},"version":"1.0.0","type":"module"}',
    });
    return Effect.gen(function* () {
      const { pkg } = yield* readPkg('/project');
      expect(Object.keys(pkg)).toEqual(['name', 'scripts', 'version', 'type']);
      expect(Object.keys(pkg.scripts ?? {})).toEqual(['z', 'a']);
    }).pipe(Effect.provide(fs.layer));
  });

  it.effect('fails with PkgInvalid naming the field when a known field has the wrong shape', () => {
    const fs = makeTestFs({ '/project/package.json': '{"type":"esm"}' });
    return Effect.gen(function* () {
      const error = yield* Effect.flip(readPkg('/project'));
      expect(error._tag).toBe('PkgInvalid');
      expect(error.message).toContain('["type"]');
    }).pipe(Effect.provide(fs.layer));
  });

  it.effect('fails with PkgNotFound when package.json is missing', () => {
    const fs = makeTestFs();
    return Effect.gen(function* () {
      const error = yield* Effect.flip(readPkg('/project'));
      expect(error._tag).toBe('PkgNotFound');
      expect(error).toMatchObject({ cwd: '/project' });
    }).pipe(Effect.provide(fs.layer));
  });

  it.effect('fails with PkgInvalid when package.json is not valid JSON', () => {
    const fs = makeTestFs({ '/project/package.json': '{nope' });
    return Effect.gen(function* () {
      const error = yield* Effect.flip(readPkg('/project'));
      expect(error._tag).toBe('PkgInvalid');
      expect(error).toMatchObject({ pkgPath: '/project/package.json' });
    }).pipe(Effect.provide(fs.layer));
  });
});

describe('writePkg', () => {
  it.effect('writes pretty-printed JSON with a trailing newline', () => {
    const fs = makeTestFs();
    return Effect.gen(function* () {
      yield* writePkg('/project/package.json', { scripts: { lint: 'oxlint' } });
      expect(fs.files.get('/project/package.json')).toBe(
        JSON.stringify({ scripts: { lint: 'oxlint' } }, null, 2) + '\n',
      );
    }).pipe(Effect.provide(fs.layer));
  });
});

import { describe, expect, it } from '@effect/vitest';
import { Effect, Layer } from 'effect';

import { apply } from '../../src/commands/add-github-actions/index.ts';
import { missingScripts, workflowFile } from '../../src/commands/add-github-actions/logic.ts';
import { makeTestFs } from '../support/fs.ts';
import { makeTestPrompter } from '../support/prompter.ts';

const pnpmOptions = {
  pm: 'pnpm',
  jobs: ['lint', 'test'],
  hasNvmrc: true,
  hasPackageManagerField: true,
} as const;

describe('missingScripts', () => {
  it('lists selected jobs without a matching script', () => {
    expect(missingScripts({ lint: 'oxlint' }, ['test', 'lint', 'build'])).toEqual([
      'build',
      'test',
    ]);
    expect(missingScripts(undefined, ['lint'])).toEqual(['lint']);
  });
});

describe('apply', () => {
  it.effect('writes the workflow and warns about missing scripts', () => {
    const fs = makeTestFs({ '/project/.nvmrc': 'lts/*\n' });
    const prompter = makeTestPrompter();
    return Effect.gen(function* () {
      yield* apply('/project', 'pnpm', { packageManager: 'pnpm@11.0.0', scripts: { lint: 'x' } }, [
        'lint',
        'test',
      ]);
      expect(fs.files.get('/project/.github/workflows/ci.yml')).toBe(workflowFile(pnpmOptions));
      expect(prompter.log.warnings).toEqual([
        'No `test` script in package.json - the `test` CI job will fail until you add one',
      ]);
    }).pipe(Effect.provide(Layer.mergeAll(fs.layer, prompter.layer)));
  });

  it.effect('leaves an existing workflow alone', () => {
    const fs = makeTestFs({ '/project/.github/workflows/ci.yml': 'mine\n' });
    const prompter = makeTestPrompter();
    return Effect.gen(function* () {
      yield* apply('/project', 'pnpm', {}, ['lint']);
      expect(fs.files.get('/project/.github/workflows/ci.yml')).toBe('mine\n');
      expect(prompter.log.warnings).toEqual([
        '`.github/workflows/ci.yml` already exists - skipping GitHub Actions workflow',
      ]);
    }).pipe(Effect.provide(Layer.mergeAll(fs.layer, prompter.layer)));
  });
});

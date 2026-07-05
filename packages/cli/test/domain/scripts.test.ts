import { describe, expect, it } from '@effect/vitest';

import { planScripts } from '../../src/domain/scripts.ts';

describe('planScripts', () => {
  it('adds all wanted scripts when none exist', () => {
    const plan = planScripts(undefined, { lint: 'oxlint', 'lint:fix': 'oxlint --fix' });
    expect(plan.scripts).toEqual({ lint: 'oxlint', 'lint:fix': 'oxlint --fix' });
    expect(plan.added).toEqual(['lint', 'lint:fix']);
    expect(plan.skipped).toEqual([]);
  });

  it('keeps existing scripts untouched and reports them as skipped', () => {
    const plan = planScripts({ lint: 'eslint .' }, { lint: 'oxlint', 'lint:fix': 'oxlint --fix' });
    expect(plan.scripts).toEqual({ lint: 'eslint .', 'lint:fix': 'oxlint --fix' });
    expect(plan.added).toEqual(['lint:fix']);
    expect(plan.skipped).toEqual(['lint']);
  });

  it('treats an empty-string script as missing', () => {
    const plan = planScripts({ lint: '' }, { lint: 'oxlint' });
    expect(plan.scripts).toEqual({ lint: 'oxlint' });
    expect(plan.added).toEqual(['lint']);
  });

  it('does not mutate the input scripts', () => {
    const current = { build: 'tsc' };
    planScripts(current, { lint: 'oxlint' });
    expect(current).toEqual({ build: 'tsc' });
  });
});

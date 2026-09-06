import { describe, expect, it } from 'vitest';

import { configFileName, configFlag } from '../../src/domain/setup.ts';

describe('configFileName', () => {
  it('uses .ts for ESM projects and .mts for CJS ones', () => {
    expect(configFileName('oxlint', true)).toBe('oxlint.config.ts');
    expect(configFileName('oxfmt', false)).toBe('oxfmt.config.mts');
    expect(configFileName('knip', false)).toBe('knip.config.mts');
  });
});

describe('configFlag', () => {
  it('is empty for extensions the tools auto-discover', () => {
    expect(configFlag('oxlint.config.ts')).toBe('');
    expect(configFlag('oxlint.config.js')).toBe('');
    expect(configFlag('oxlint.config.cjs')).toBe('');
    expect(configFlag('oxlint.config.mjs')).toBe('');
    expect(configFlag('.oxlintrc.json')).toBe('');
  });

  it('names configs the tools do not auto-discover', () => {
    expect(configFlag('oxlint.config.mts')).toBe(' -c oxlint.config.mts');
    expect(configFlag('oxlint.config.cts')).toBe(' -c oxlint.config.cts');
    expect(configFlag('oxfmt.config.mts')).toBe(' -c oxfmt.config.mts');
  });

  it('matches the extension exactly, so .mts is not read as .ts', () => {
    expect(configFlag('oxfmt.config.mts')).not.toBe('');
  });
});

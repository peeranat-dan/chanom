import { describe, expect, it } from 'vitest';

import knipConfig from '../src/knip/index.js';
import oxfmtBase from '../src/oxfmt/base-config.js';
import oxlintConfig from '../src/oxlint/index.js';
import { configNames, formatConfig, loadConfig, parseArgs, usage } from '../src/print.js';

describe('parseArgs', () => {
  it('parses print with a known config name', () => {
    expect(parseArgs(['print', 'oxlint/config'])).toEqual({ kind: 'print', name: 'oxlint/config' });
  });

  it('parses list', () => {
    expect(parseArgs(['list'])).toEqual({ kind: 'list' });
  });

  it.each([[[]], [['--help']], [['-h']]])('shows usage without an error for %j', (args) => {
    expect(parseArgs(args)).toEqual({ kind: 'usage' });
  });

  it('rejects an unknown command', () => {
    expect(parseArgs(['show'])).toEqual({ kind: 'usage', error: 'Unknown command: show' });
  });

  it('rejects print without a name', () => {
    expect(parseArgs(['print'])).toEqual({ kind: 'usage', error: 'Missing config name.' });
  });

  it('rejects an unknown config name', () => {
    expect(parseArgs(['print', 'eslint/base'])).toEqual({
      kind: 'usage',
      error: 'Unknown config: eslint/base',
    });
  });

  it('does not treat inherited object keys as config names', () => {
    expect(parseArgs(['print', 'toString'])).toEqual({
      kind: 'usage',
      error: 'Unknown config: toString',
    });
  });
});

describe('usage', () => {
  it('lists every config name', () => {
    const text = usage();
    for (const name of configNames) expect(text).toContain(`  ${name}`);
  });
});

describe('loadConfig', () => {
  it.each([
    ['oxlint/config', oxlintConfig],
    ['oxfmt/base', oxfmtBase],
    ['knip/config', knipConfig],
  ] as const)('loads the default export of %s', async (name, expected) => {
    expect(await loadConfig(name)).toBe(expected);
  });

  it('loads every listed config', async () => {
    for (const name of configNames) expect(await loadConfig(name)).toBeTypeOf('object');
  });
});

describe('formatConfig', () => {
  it('renders pretty-printed JSON that round-trips', () => {
    const output = formatConfig(oxfmtBase);
    expect(output).toContain('\n  "tabWidth": 2,');
    expect(JSON.parse(output)).toEqual(oxfmtBase);
  });
});

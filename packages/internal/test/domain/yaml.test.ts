import { describe, expect, it } from 'vitest';
import { Document } from 'yaml';

import { spaceItems, YAML_OPTIONS } from '../../src/domain/yaml.ts';

describe('spaceItems', () => {
  it('separates map entries with blank lines', () => {
    const doc = new Document({ a: 1, b: 2, c: 3 });
    spaceItems(doc.contents);
    expect(doc.toString(YAML_OPTIONS)).toBe('a: 1\n\nb: 2\n\nc: 3\n');
  });

  it('separates sequence items with blank lines', () => {
    const doc = new Document([{ a: 1 }, { b: 2 }]);
    spaceItems(doc.contents);
    expect(doc.toString(YAML_OPTIONS)).toBe('- a: 1\n\n- b: 2\n');
  });

  it('ignores scalars', () => {
    const doc = new Document('plain');
    spaceItems(doc.contents);
    expect(doc.toString(YAML_OPTIONS)).toBe('plain\n');
  });
});

describe('YAML_OPTIONS', () => {
  it('single-quotes strings that need quoting and keeps long lines whole', () => {
    const long = 'x '.repeat(60).trim();
    const doc = new Document({ branches: ['*'], run: long });
    expect(doc.toString(YAML_OPTIONS)).toBe(`branches:\n  - '*'\nrun: ${long}\n`);
  });
});

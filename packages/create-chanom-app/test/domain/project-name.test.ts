import { describe, expect, it } from 'vitest';

import { toKebabCase } from '../../src/domain/project-name.ts';

describe('toKebabCase', () => {
  it.each([
    ['PascalCase', 'pascal-case'],
    ['camelCase', 'camel-case'],
    ['SNAKE_CASE', 'snake-case'],
    ['XMLHttpRequest', 'xml-http-request'],
    ['already-kebab-case', 'already-kebab-case'],
    ['app_2.0', 'app-2-0'],
  ])('converts %s to %s', (input, expected) => {
    expect(toKebabCase(input)).toBe(expected);
  });
});

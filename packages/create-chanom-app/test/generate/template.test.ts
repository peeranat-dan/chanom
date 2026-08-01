import { describe, expect, it } from 'vitest';

import { renderTemplate } from '../../src/generate/template.ts';

describe('renderTemplate', () => {
  it('substitutes a known token', () => {
    expect(renderTemplate('# {{appName}}', { appName: 'my-app' })).toBe('# my-app');
  });

  it('replaces every occurrence of a token in one pass', () => {
    expect(renderTemplate('{{appName}} and {{appName}}', { appName: 'x' })).toBe('x and x');
  });

  it('leaves an unknown token untouched rather than emitting undefined', () => {
    expect(renderTemplate('{{unknown}}', { appName: 'x' })).toBe('{{unknown}}');
  });

  it('does not clobber an incidental occurrence of a value', () => {
    // The bare value appears in prose but only the delimited token is replaced.
    expect(renderTemplate('install my-app: # {{appName}}', { appName: 'my-app' })).toBe(
      'install my-app: # my-app',
    );
  });

  it('returns content without tokens unchanged', () => {
    expect(renderTemplate('no tokens here', { appName: 'x' })).toBe('no tokens here');
  });
});

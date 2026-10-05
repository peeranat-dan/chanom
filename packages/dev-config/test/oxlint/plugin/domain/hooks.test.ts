import { describe, expect, it } from 'vitest';

import {
  getBasename,
  isHookFilename,
  isHookName,
  isInHooksDir,
} from '../../../../src/oxlint/plugin/domain/hooks.ts';

describe('isInHooksDir', () => {
  it('matches files nested anywhere under a hooks folder', () => {
    expect(isInHooksDir('/app/src/hooks/use-foo.ts')).toBe(true);
    expect(isInHooksDir('/app/src/hooks/auth/use-session.ts')).toBe(true);
    expect(isInHooksDir('C:\\app\\src\\hooks\\use-foo.ts')).toBe(true);
  });

  it('ignores files outside a hooks folder', () => {
    expect(isInHooksDir('/app/src/components/button.tsx')).toBe(false);
    expect(isInHooksDir('/app/src/my-hooks/foo.ts')).toBe(false);
    expect(isInHooksDir('/app/src/hooks.ts')).toBe(false);
  });
});

describe('getBasename', () => {
  it('strips the directory and every extension', () => {
    expect(getBasename('/app/src/hooks/use-foo.test.ts')).toBe('use-foo');
    expect(getBasename('/app/src/hooks/useFoo.tsx')).toBe('useFoo');
    expect(getBasename('Makefile')).toBe('Makefile');
  });
});

describe('isHookFilename', () => {
  it('accepts kebab, camel, and snake case use prefixes', () => {
    expect(isHookFilename('/hooks/use-foo.ts')).toBe(true);
    expect(isHookFilename('/hooks/useFoo.tsx')).toBe(true);
    expect(isHookFilename('/hooks/use_foo.ts')).toBe(true);
    expect(isHookFilename('/hooks/use-foo.test.ts')).toBe(true);
  });

  it('exempts barrel files', () => {
    expect(isHookFilename('/hooks/index.ts')).toBe(true);
  });

  it('rejects names without a use prefix or with use as part of a word', () => {
    expect(isHookFilename('/hooks/foo.ts')).toBe(false);
    expect(isHookFilename('/hooks/user.ts')).toBe(false);
    expect(isHookFilename('/hooks/use.ts')).toBe(false);
  });
});

describe('isHookName', () => {
  it('accepts use followed by an uppercase letter or digit', () => {
    expect(isHookName('useFoo')).toBe(true);
    expect(isHookName('use3d')).toBe(true);
  });

  it('rejects names without a use prefix or with use as part of a word', () => {
    expect(isHookName('foo')).toBe(false);
    expect(isHookName('user')).toBe(false);
    expect(isHookName('use')).toBe(false);
    expect(isHookName('UseFoo')).toBe(false);
  });
});

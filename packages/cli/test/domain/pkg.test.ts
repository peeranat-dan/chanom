import { describe, expect, it } from '@effect/vitest';

import { getMismatchedPackage, isEsm, isPackageInstalled } from '../../src/domain/pkg.ts';

describe('isEsm', () => {
  it('is true only when type is module', () => {
    expect(isEsm({ type: 'module' })).toBe(true);
    expect(isEsm({ type: 'commonjs' })).toBe(false);
    expect(isEsm({})).toBe(false);
  });
});

describe('isPackageInstalled', () => {
  it('finds packages in dependencies and devDependencies', () => {
    expect(isPackageInstalled({ dependencies: { oxlint: '1.0.0' } }, 'oxlint')).toBe(true);
    expect(isPackageInstalled({ devDependencies: { oxlint: '1.0.0' } }, 'oxlint')).toBe(true);
  });

  it('is false when the package is missing', () => {
    expect(isPackageInstalled({}, 'oxlint')).toBe(false);
    expect(isPackageInstalled({ dependencies: { oxfmt: '1.0.0' } }, 'oxlint')).toBe(false);
  });
});

describe('getMismatchedPackage', () => {
  it('returns undefined when the installed version matches, ignoring range prefixes', () => {
    expect(
      getMismatchedPackage({ devDependencies: { oxlint: '2.0.0' } }, 'oxlint', '2.0.0'),
    ).toBeUndefined();
    expect(
      getMismatchedPackage({ devDependencies: { oxlint: '^2.0.0' } }, 'oxlint', '2.0.0'),
    ).toBeUndefined();
    expect(
      getMismatchedPackage({ dependencies: { oxlint: '~2.0.0' } }, 'oxlint', '2.0.0'),
    ).toBeUndefined();
  });

  it('returns the pinned spec when not installed', () => {
    expect(getMismatchedPackage({}, 'oxlint', '2.0.0')).toBe('oxlint@2.0.0');
  });

  it('flags mismatches in both directions', () => {
    expect(getMismatchedPackage({ devDependencies: { oxlint: '1.9.0' } }, 'oxlint', '2.0.0')).toBe(
      'oxlint@2.0.0',
    );
    expect(getMismatchedPackage({ devDependencies: { oxlint: '3.0.0' } }, 'oxlint', '2.0.0')).toBe(
      'oxlint@2.0.0',
    );
  });
});

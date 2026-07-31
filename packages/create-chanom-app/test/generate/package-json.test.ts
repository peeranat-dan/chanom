import { describe, expect, it } from 'vitest';

import { emptyContribution } from '../../src/domain/contribution.ts';
import { buildPackageJson } from '../../src/generate/package-json.ts';

const versions = { react: '19.0.0', 'react-dom': '19.0.0', typescript: '5.0.0' };

describe('buildPackageJson', () => {
  it('normalizes the app name for the npm package name', () => {
    const pkg = JSON.parse(
      buildPackageJson({ appName: 'MyAwesome_App', contribution: emptyContribution, versions }),
    );

    expect(pkg.name).toBe('my-awesome-app');
  });

  it('renders a pinned manifest byte-for-byte', () => {
    const contribution = {
      ...emptyContribution,
      dependencies: ['react-dom', 'react'],
      devDependencies: ['typescript'],
      scripts: { dev: 'vite', build: 'tsc -b && vite build' },
    };

    expect(buildPackageJson({ appName: 'my-app', contribution, versions })).toBe(
      `{
  "name": "my-app",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build"
  },
  "dependencies": {
    "react": "19.0.0",
    "react-dom": "19.0.0"
  },
  "devDependencies": {
    "typescript": "5.0.0"
  }
}
`,
    );
  });

  it('omits the deprecated pnpm.onlyBuiltDependencies field', () => {
    const pkg = JSON.parse(
      buildPackageJson({ appName: 'a', contribution: emptyContribution, versions }),
    );
    expect(pkg.pnpm).toBeUndefined();
  });

  it('records the packageManager field when provided', () => {
    const json = buildPackageJson({
      appName: 'a',
      packageManager: 'pnpm@11.9.0',
      contribution: emptyContribution,
      versions,
    });
    expect(JSON.parse(json).packageManager).toBe('pnpm@11.9.0');
  });

  it('sorts dependency keys regardless of contribution order', () => {
    const contribution = { ...emptyContribution, devDependencies: ['typescript', 'react'] };
    const pkg = JSON.parse(buildPackageJson({ appName: 'a', contribution, versions }));
    expect(Object.keys(pkg.devDependencies)).toEqual(['react', 'typescript']);
  });

  it('throws rather than emit an unpinned version', () => {
    const contribution = { ...emptyContribution, dependencies: ['react'] };
    expect(() => buildPackageJson({ appName: 'a', contribution, versions: {} })).toThrow(
      /No pinned version for "react"/,
    );
  });
});

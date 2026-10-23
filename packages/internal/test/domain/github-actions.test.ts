import { describe, expect, it } from 'vitest';

import { orderJobs, workflowFile } from '../../src/domain/github-actions.ts';

const pnpmOptions = {
  pm: 'pnpm',
  jobs: ['lint', 'test'],
  hasNvmrc: true,
  hasPackageManagerField: true,
} as const;

describe('orderJobs', () => {
  it('puts jobs in workflow order and drops duplicates', () => {
    expect(orderJobs(['test', 'lint', 'test', 'build'])).toEqual(['lint', 'build', 'test']);
  });
});

describe('workflowFile', () => {
  it('writes one independent pnpm job per selected check', () => {
    expect(workflowFile(pnpmOptions)).toBe(`name: CI

on:
  pull_request:
    branches: ['*']

concurrency:
  group: \${{ github.workflow }}-\${{ github.ref }}
  cancel-in-progress: true

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7

      - uses: pnpm/action-setup@v6

      - uses: actions/setup-node@v6
        with:
          node-version-file: '.nvmrc'
          cache: pnpm

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Lint
        run: pnpm run lint

  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7

      - uses: pnpm/action-setup@v6

      - uses: actions/setup-node@v6
        with:
          node-version-file: '.nvmrc'
          cache: pnpm

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Test
        run: pnpm run test
`);
  });

  it('falls back to the LTS Node version without .nvmrc', () => {
    const file = workflowFile({ ...pnpmOptions, hasNvmrc: false });
    expect(file).toContain("node-version: 'lts/*'");
    expect(file).not.toContain('node-version-file');
  });

  it('pins a pnpm version when package.json has no packageManager field', () => {
    expect(workflowFile({ ...pnpmOptions, hasPackageManagerField: false })).toContain(
      '      - uses: pnpm/action-setup@v6\n        with:\n          version: latest\n',
    );
  });

  it('uses npm ci and the npm cache for npm', () => {
    const file = workflowFile({ ...pnpmOptions, pm: 'npm', jobs: ['build'] });
    expect(file).toContain('cache: npm');
    expect(file).toContain('run: npm ci');
    expect(file).toContain('run: npm run build');
    expect(file).not.toContain('pnpm');
  });

  it('enables corepack before setting up node for yarn', () => {
    const file = workflowFile({ ...pnpmOptions, pm: 'yarn', jobs: ['typecheck'] });
    expect(file).toContain('      - run: corepack enable\n\n      - uses: actions/setup-node@v6');
    expect(file).toContain('cache: yarn');
    expect(file).toContain('run: yarn install --frozen-lockfile');
    expect(file).toContain('run: yarn run typecheck');
  });

  it('sets up bun instead of node for bun', () => {
    const file = workflowFile({ ...pnpmOptions, pm: 'bun', jobs: ['test'] });
    expect(file).toContain('uses: oven-sh/setup-bun@v2');
    expect(file).not.toContain('setup-node');
    expect(file).toContain('run: bun install --frozen-lockfile');
    expect(file).toContain('run: bun run test');
  });
});

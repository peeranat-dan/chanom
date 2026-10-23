import type { PackageManager } from './package-manager.ts';

export type CiJob = 'lint' | 'build' | 'typecheck' | 'test';

/** Every job the workflow can contain, in the order they appear in the file. */
export const CI_JOBS: readonly CiJob[] = ['lint', 'build', 'typecheck', 'test'];

export const WORKFLOW_PATH = '.github/workflows/ci.yml';

export interface WorkflowOptions {
  readonly pm: PackageManager;
  readonly jobs: readonly CiJob[];
  /** `.nvmrc` exists, so setup-node reads the Node version from it. */
  readonly hasNvmrc: boolean;
  /** `package.json` has a `packageManager` field, which pnpm/action-setup reads its version from. */
  readonly hasPackageManagerField: boolean;
}

const INSTALL_COMMAND: Record<PackageManager, string> = {
  pnpm: 'pnpm install --frozen-lockfile',
  npm: 'npm ci',
  // Yarn berry still accepts the classic flag as an alias for `--immutable`.
  yarn: 'yarn install --frozen-lockfile',
  bun: 'bun install --frozen-lockfile',
};

function setupNodeStep(cache: PackageManager, hasNvmrc: boolean): string[] {
  return [
    '      - uses: actions/setup-node@v6',
    '        with:',
    hasNvmrc ? "          node-version-file: '.nvmrc'" : "          node-version: 'lts/*'",
    `          cache: ${cache}`,
  ];
}

/** Steps that bring a job up to "dependencies installed", one blank-line-separated block per step. */
function setupSteps(options: WorkflowOptions): string[][] {
  const checkout = ['      - uses: actions/checkout@v7'];
  const install = [
    '      - name: Install dependencies',
    `        run: ${INSTALL_COMMAND[options.pm]}`,
  ];

  switch (options.pm) {
    case 'pnpm':
      return [
        checkout,
        // Without a `packageManager` field the action has no version to install.
        options.hasPackageManagerField
          ? ['      - uses: pnpm/action-setup@v6']
          : ['      - uses: pnpm/action-setup@v6', '        with:', '          version: latest'],
        setupNodeStep('pnpm', options.hasNvmrc),
        install,
      ];
    case 'npm':
      return [checkout, setupNodeStep('npm', options.hasNvmrc), install];
    case 'yarn':
      // setup-node's yarn cache shells out to yarn, so corepack must provide it first.
      return [
        checkout,
        ['      - run: corepack enable'],
        setupNodeStep('yarn', options.hasNvmrc),
        install,
      ];
    case 'bun':
      return [checkout, ['      - uses: oven-sh/setup-bun@v2'], install];
  }
}

const JOB_STEP_NAME: Record<CiJob, string> = {
  lint: 'Lint',
  build: 'Build',
  typecheck: 'Typecheck',
  test: 'Test',
};

function jobBlock(job: CiJob, options: WorkflowOptions): string {
  const run = [`      - name: ${JOB_STEP_NAME[job]}`, `        run: ${options.pm} run ${job}`];
  const steps = [...setupSteps(options), run].map((step) => step.join('\n')).join('\n\n');
  return [`  ${job}:`, '    runs-on: ubuntu-latest', '    steps:', steps].join('\n');
}

/** Selected jobs deduplicated and put in workflow order. */
export function orderJobs(jobs: readonly CiJob[]): CiJob[] {
  return CI_JOBS.filter((job) => jobs.includes(job));
}

/**
 * `.github/workflows/ci.yml` contents: one independent job per selected check,
 * each running `<pm> run <job>`. Shared so `chanom brew` and
 * `create-chanom-app` emit byte-identical workflows.
 */
export function workflowFile(options: WorkflowOptions): string {
  const header = [
    'name: CI',
    '',
    'on:',
    '  pull_request:',
    "    branches: ['*']",
    '',
    'concurrency:',
    '  group: ${{ github.workflow }}-${{ github.ref }}',
    '  cancel-in-progress: true',
    '',
    'jobs:',
  ].join('\n');
  const jobs = orderJobs(options.jobs).map((job) => jobBlock(job, options));
  return `${header}\n${jobs.join('\n\n')}\n`;
}

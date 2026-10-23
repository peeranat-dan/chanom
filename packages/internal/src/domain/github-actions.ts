import { Document, isMap, isSeq } from 'yaml';

import type { PackageManager } from './package-manager.ts';

import { spaceItems, YAML_OPTIONS } from './yaml.ts';

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

interface Step {
  readonly name?: string;
  readonly uses?: string;
  readonly with?: Readonly<Record<string, string>>;
  readonly run?: string;
}

const INSTALL_COMMAND: Record<PackageManager, string> = {
  pnpm: 'pnpm install --frozen-lockfile',
  npm: 'npm ci',
  // Yarn berry still accepts the classic flag as an alias for `--immutable`.
  yarn: 'yarn install --frozen-lockfile',
  bun: 'bun install --frozen-lockfile',
};

const JOB_STEP_NAME: Record<CiJob, string> = {
  lint: 'Lint',
  build: 'Build',
  typecheck: 'Typecheck',
  test: 'Test',
};

function setupNode(cache: PackageManager, hasNvmrc: boolean): Step {
  return {
    uses: 'actions/setup-node@v6',
    with: {
      ...(hasNvmrc ? { 'node-version-file': '.nvmrc' } : { 'node-version': 'lts/*' }),
      cache,
    },
  };
}

/** Steps that bring a job up to "dependencies installed". */
function setupSteps(options: WorkflowOptions): Step[] {
  const checkout: Step = { uses: 'actions/checkout@v7' };
  const install: Step = { name: 'Install dependencies', run: INSTALL_COMMAND[options.pm] };

  switch (options.pm) {
    case 'pnpm':
      return [
        checkout,
        // Without a `packageManager` field the action has no version to install.
        options.hasPackageManagerField
          ? { uses: 'pnpm/action-setup@v6' }
          : { uses: 'pnpm/action-setup@v6', with: { version: 'latest' } },
        setupNode('pnpm', options.hasNvmrc),
        install,
      ];
    case 'npm':
      return [checkout, setupNode('npm', options.hasNvmrc), install];
    case 'yarn':
      // setup-node's yarn cache shells out to yarn, so corepack must provide it first.
      return [checkout, { run: 'corepack enable' }, setupNode('yarn', options.hasNvmrc), install];
    case 'bun':
      return [checkout, { uses: 'oven-sh/setup-bun@v2' }, install];
  }
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
  const jobs = Object.fromEntries(
    orderJobs(options.jobs).map((job) => [
      job,
      {
        'runs-on': 'ubuntu-latest',
        steps: [
          ...setupSteps(options),
          { name: JOB_STEP_NAME[job], run: `${options.pm} run ${job}` },
        ],
      },
    ]),
  );

  const doc = new Document({
    name: 'CI',
    on: { pull_request: { branches: ['*'] } },
    concurrency: {
      group: '${{ github.workflow }}-${{ github.ref }}',
      'cancel-in-progress': true,
    },
    jobs,
  });

  // Layout only: blank lines between top-level keys, jobs, and steps, and the
  // branch filter inline - matching how workflows are written by hand.
  spaceItems(doc.contents);
  const branches = doc.getIn(['on', 'pull_request', 'branches'], true);
  if (isSeq(branches)) branches.flow = true;
  const jobNodes = doc.get('jobs', true);
  spaceItems(jobNodes);
  if (isMap(jobNodes)) {
    for (const pair of jobNodes.items) {
      if (isMap(pair.value)) spaceItems(pair.value.get('steps', true));
    }
  }

  return doc.toString(YAML_OPTIONS);
}

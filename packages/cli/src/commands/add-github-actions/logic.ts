import type { CiJob } from '@chanom/internal';

import { orderJobs } from '@chanom/internal';

/**
 * The workflow itself lives in `@chanom/internal` so `chanom brew` and
 * `create-chanom-app` emit byte-identical CI config. This module re-exports it
 * to keep the command's `logic.ts` boundary intact.
 */
export {
  CI_JOBS,
  type CiJob,
  orderJobs,
  WORKFLOW_PATH,
  type WorkflowOptions,
  workflowFile,
} from '@chanom/internal';

/** Selected jobs whose `<pm> run <job>` has no matching script in package.json. */
export function missingScripts(
  scripts: Readonly<Record<string, string>> | undefined,
  jobs: readonly CiJob[],
): CiJob[] {
  return orderJobs(jobs).filter((job) => scripts?.[job] === undefined);
}

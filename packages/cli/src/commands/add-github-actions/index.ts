import { Prompter } from '@chanom/internal';
import { Effect, FileSystem, Path } from 'effect';

import type { PackageManager } from '../../domain/package-manager.ts';
import type { Pkg } from '../../domain/pkg.ts';

import { type CiJob, missingScripts, WORKFLOW_PATH, workflowFile } from './logic.ts';

export {
  CI_JOBS,
  type CiJob,
  missingScripts,
  orderJobs,
  WORKFLOW_PATH,
  workflowFile,
} from './logic.ts';

/**
 * Writes `.github/workflows/ci.yml` with one job per selected check. An
 * existing workflow is left alone. `pkg` should already carry the scripts the
 * other toppings added, so the missing-script warning only names scripts the
 * user still has to write. Contributes no packages and no scripts, so - like
 * `add-vscode` - it returns nothing for the caller to persist.
 */
export const apply = Effect.fn('add-github-actions.apply')(function* (
  cwd: string,
  pm: PackageManager,
  pkg: Pkg,
  jobs: readonly CiJob[],
) {
  const fs = yield* FileSystem.FileSystem;
  const path = yield* Path.Path;
  const prompter = yield* Prompter;

  const filePath = path.join(cwd, WORKFLOW_PATH);
  if (yield* fs.exists(filePath)) {
    yield* prompter.warn(`\`${WORKFLOW_PATH}\` already exists - skipping GitHub Actions workflow`);
    return;
  }

  const hasNvmrc = yield* fs.exists(path.join(cwd, '.nvmrc'));
  yield* fs.makeDirectory(path.dirname(filePath), { recursive: true });
  yield* fs.writeFileString(
    filePath,
    workflowFile({ pm, jobs, hasNvmrc, hasPackageManagerField: pkg.packageManager !== undefined }),
  );

  for (const job of missingScripts(pkg.scripts, jobs)) {
    yield* prompter.warn(
      `No \`${job}\` script in package.json - the \`${job}\` CI job will fail until you add one`,
    );
  }
});

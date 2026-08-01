import { CommandRunner, Git, type PackageManager, Prompter } from '@chanom/internal';
import { FileSystem, Path } from '@effect/platform';
import { Data, Effect } from 'effect';
import pc from 'picocolors';

import type { Contribution } from './domain/contribution.ts';

import { depVersions } from './bundled-versions.ts';
import { mergeContributions } from './domain/contribution.ts';
import { toKebabCase } from './domain/project-name.ts';
import { renderIndexHtml } from './generate/index-html.ts';
import { buildPackageJson } from './generate/package-json.ts';
import { buildPnpmWorkspace } from './generate/pnpm-workspace.ts';
import { renderTemplate } from './generate/template.ts';
import { buildTsconfig } from './generate/tsconfig.ts';
import { renderViteConfig } from './generate/vite-config.ts';
import { TEMPLATE_FILES } from './templates.ts';
import { selectContributions } from './toppings.ts';

export class InstallFailed extends Data.TaggedError('InstallFailed')<{
  readonly pm: PackageManager;
}> {}

export interface ScaffoldPlan {
  readonly targetDir: string;
  readonly appName: string;
  readonly pm: PackageManager;
  /** `name@version` written into `packageManager`, when known. */
  readonly packageManagerField?: string;
  readonly git: boolean;
  readonly commitHooks: boolean;
  readonly install: boolean;
  /** Absolute path of the shipped `templates/` directory. */
  readonly templatesRoot: string;
}

const writeFile = Effect.fn('scaffold.writeFile')(function* (
  targetDir: string,
  relPath: string,
  contents: string,
) {
  const fs = yield* FileSystem.FileSystem;
  const path = yield* Path.Path;
  const dest = path.join(targetDir, relPath);
  yield* fs.makeDirectory(path.dirname(dest), { recursive: true });
  yield* fs.writeFileString(dest, contents);
});

const copyTemplates = Effect.fn('scaffold.copyTemplates')(function* (plan: ScaffoldPlan) {
  const fs = yield* FileSystem.FileSystem;
  const path = yield* Path.Path;
  // One vars map for the whole run: every template is rendered through the same
  // replacer, so a file without a `{{token}}` passes through unchanged and a new
  // templated file needs no dispatch wiring here.
  const vars = { appName: toKebabCase(plan.appName) };
  yield* Effect.forEach(
    TEMPLATE_FILES,
    (file) =>
      Effect.gen(function* () {
        const template = yield* fs.readFileString(path.join(plan.templatesRoot, file.src));
        yield* writeFile(plan.targetDir, file.dest, renderTemplate(template, vars));
      }),
    { concurrency: 'unbounded', discard: true },
  );
});

const writeGeneratedFiles = Effect.fn('scaffold.writeGeneratedFiles')(function* (
  plan: ScaffoldPlan,
  folded: Contribution,
) {
  const appName = toKebabCase(plan.appName);
  yield* writeFile(
    plan.targetDir,
    'package.json',
    buildPackageJson({
      appName,
      packageManager: plan.packageManagerField,
      contribution: folded,
      versions: depVersions,
    }),
  );
  yield* writeFile(plan.targetDir, 'pnpm-workspace.yaml', buildPnpmWorkspace());
  yield* writeFile(plan.targetDir, 'vite.config.ts', renderViteConfig(folded));
  yield* writeFile(plan.targetDir, 'tsconfig.json', buildTsconfig());
  yield* writeFile(plan.targetDir, 'index.html', renderIndexHtml(appName));

  // Topping-contributed files (hook scripts, standalone tool configs).
  for (const file of folded.files) {
    yield* writeFile(plan.targetDir, file.path, file.contents);
  }
});

const initGit = Effect.fn('scaffold.initGit')(function* (plan: ScaffoldPlan) {
  const git = yield* Git;
  const prompter = yield* Prompter;
  const s = yield* prompter.spinner('Initializing git repository...');

  yield* git.init(plan.targetDir);
  // A missing identity would abort the initial commit (common in CI); set a
  // local placeholder so scaffolding always lands a first commit.
  if (!(yield* git.hasIdentity(plan.targetDir))) {
    yield* git.setLocalIdentity(
      plan.targetDir,
      'create-chanom-app',
      'create-chanom-app@users.noreply.github.com',
    );
  }
  yield* git.stageAll(plan.targetDir);

  const result = yield* git.commit(plan.targetDir, 'chore: scaffold with create-chanom-app');
  yield* s.stop(
    result.ok ? 'Git repository initialized' : pc.yellow('Could not create the initial commit'),
  );
});

const installDependencies = Effect.fn('scaffold.installDependencies')(function* (
  plan: ScaffoldPlan,
) {
  const prompter = yield* Prompter;
  const runner = yield* CommandRunner;
  const s = yield* prompter.spinner(`Installing dependencies with ${plan.pm}...`);

  const exitCode = yield* runner
    .execInherit(plan.pm, ['install'], plan.targetDir)
    .pipe(Effect.tapError(() => s.stop(pc.red('Dependency installation failed'))));

  if (exitCode !== 0) {
    yield* s.stop(pc.red('Dependency installation failed'));
    return yield* new InstallFailed({ pm: plan.pm });
  }
  yield* s.stop('Dependencies installed');
});

/** Writes the generated app, then optionally initializes git and installs deps. */
export const scaffold = Effect.fn('scaffold')(function* (plan: ScaffoldPlan) {
  const fs = yield* FileSystem.FileSystem;

  const folded = mergeContributions(
    selectContributions({ pm: plan.pm, commitHooks: plan.commitHooks }),
  );

  yield* fs.makeDirectory(plan.targetDir, { recursive: true });
  yield* copyTemplates(plan);
  yield* writeGeneratedFiles(plan, folded);

  if (plan.git) yield* initGit(plan);
  if (plan.install) yield* installDependencies(plan);
});

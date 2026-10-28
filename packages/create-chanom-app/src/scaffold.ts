import { type CiJob, CommandRunner, Git, PackageManager, Prompter } from '@chanom/internal';
import { Effect, FileSystem, Path, Schema } from 'effect';
import pc from 'picocolors';

import type { ConfigLink, Contribution } from './domain/contribution.ts';

import { depVersions } from './bundled-versions.ts';
import { mergeContributions } from './domain/contribution.ts';
import { toKebabCase } from './domain/project-name.ts';
import { renderAppTemplate } from './generate/app-template.ts';
import { renderIndexHtml } from './generate/index-html.ts';
import { buildPackageJson } from './generate/package-json.ts';
import { buildPnpmWorkspace } from './generate/pnpm-workspace.ts';
import { renderReadme } from './generate/readme.ts';
import { buildTsconfig } from './generate/tsconfig.ts';
import { renderViteConfig } from './generate/vite-config.ts';
import { TEMPLATE_FILES } from './templates.ts';
import { selectContributions } from './toppings.ts';

export class InstallFailed extends Schema.TaggedError<InstallFailed>()('InstallFailed', {
  pm: PackageManager,
  /** Captured package manager output, since it is not streamed to the terminal. */
  output: Schema.String,
}) {}

export interface ScaffoldPlan {
  readonly targetDir: string;
  readonly appName: string;
  readonly pm: PackageManager;
  /** `name@version` written into `packageManager`, when known. */
  readonly packageManagerField?: string;
  readonly git: boolean;
  readonly commitHooks: boolean;
  readonly agentSkills: boolean;
  /** CI jobs for the github-actions topping; empty skips the topping. */
  readonly ciJobs: readonly CiJob[];
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
  const appName = toKebabCase(plan.appName);
  for (const file of TEMPLATE_FILES) {
    const template = yield* fs.readFileString(path.join(plan.templatesRoot, file.src));
    const contents =
      file.dest === 'README.md'
        ? renderReadme(template, appName)
        : file.dest === 'src/app.tsx' || file.dest === 'src/app.test.tsx'
          ? renderAppTemplate(template, appName)
          : template;
    yield* writeFile(plan.targetDir, file.dest, contents);
  }
});

/**
 * Creates one topping-contributed symlink, making its parent directory first.
 * Scaffolding into an existing directory (`create chanom-app .`) can meet a link
 * an earlier run - or `chanom add-skills` - already made, and `symlink` fails
 * with EEXIST on anything already there, so an occupied path is left alone and
 * reported instead of aborting the scaffold after the files are written.
 */
const writeLink = Effect.fn('scaffold.writeLink')(function* (targetDir: string, link: ConfigLink) {
  const fs = yield* FileSystem.FileSystem;
  const path = yield* Path.Path;
  const prompter = yield* Prompter;

  const linkPath = path.join(targetDir, link.path);
  if (yield* fs.exists(linkPath)) {
    yield* prompter.warn(`\`${link.path}\` already exists - skipping link`);
    return;
  }

  yield* fs.makeDirectory(path.dirname(linkPath), { recursive: true });
  yield* fs.symlink(link.target, linkPath);
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

  // Links come last so their targets already exist on disk.
  for (const link of folded.links) {
    yield* writeLink(plan.targetDir, link);
  }
});

const initGit = Effect.fn('scaffold.initGit')(function* (plan: ScaffoldPlan) {
  const git = yield* Git;
  const prompter = yield* Prompter;
  const s = yield* prompter.spinner('Initializing git repository...');
  yield* git.init(plan.targetDir);
  yield* s.stop('Git repository initialized');
});

const commitScaffold = Effect.fn('scaffold.commitScaffold')(function* (plan: ScaffoldPlan) {
  const git = yield* Git;
  const prompter = yield* Prompter;
  const s = yield* prompter.spinner('Creating the initial commit...');

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
    result.ok ? 'Initial commit created' : pc.yellow('Could not create the initial commit'),
  );
});

const installDependencies = Effect.fn('scaffold.installDependencies')(function* (
  plan: ScaffoldPlan,
) {
  const prompter = yield* Prompter;
  const runner = yield* CommandRunner;
  const s = yield* prompter.spinner(`Installing dependencies with ${plan.pm}...`);

  // Captured, not inherited: the package manager's own progress output would
  // fight the spinner for the terminal and make it flicker.
  const result = yield* runner
    .capture(plan.pm, ['install'], plan.targetDir)
    .pipe(Effect.tapError(() => s.stop(pc.red('Dependency installation failed'))));

  if (result.exitCode !== 0) {
    yield* s.stop(pc.red('Dependency installation failed'));
    return yield* new InstallFailed({
      pm: plan.pm,
      output: [result.stdout, result.stderr].filter(Boolean).join('\n'),
    });
  }
  yield* s.stop('Dependencies installed');
});

/** Writes the generated app, then optionally initializes git, installs deps, and commits. */
export const scaffold = Effect.fn('scaffold')(function* (plan: ScaffoldPlan) {
  const fs = yield* FileSystem.FileSystem;

  const folded = mergeContributions(
    selectContributions({
      pm: plan.pm,
      commitHooks: plan.commitHooks,
      agentSkills: plan.agentSkills,
      ciJobs: plan.ciJobs,
      hasPackageManagerField: plan.packageManagerField !== undefined,
    }),
  );

  yield* fs.makeDirectory(plan.targetDir, { recursive: true });
  yield* copyTemplates(plan);
  yield* writeGeneratedFiles(plan, folded);

  // Ordered init -> install -> commit: husky's `prepare` script needs the repo
  // to exist when it runs, and committing after the install puts the lockfile
  // in the initial commit (the generated CI installs with a frozen lockfile).
  if (plan.git) yield* initGit(plan);
  if (plan.install) {
    yield* installDependencies(plan).pipe(
      // A failed install still leaves a committed scaffold behind.
      Effect.tapError(() => (plan.git ? commitScaffold(plan) : Effect.void)),
    );
  }
  if (plan.git) yield* commitScaffold(plan);
});

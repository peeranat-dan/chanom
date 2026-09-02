import type { Cancelled, PackageManager } from '@chanom/internal';

import { Prompter, resolvePm } from '@chanom/internal';
import { FileSystem, Path } from '@effect/platform';
import { Data, Effect, Logger, LogLevel } from 'effect';
import pc from 'picocolors';

import { pkgVersion } from './bundled-versions.ts';
import { parseArgs, validateProjectName } from './domain/args.ts';
import { toKebabCase } from './domain/project-name.ts';
import { scaffold } from './scaffold.ts';

const DEFAULT_NAME = 'my-chanom-app';

const HELP = `${pc.bold('create-chanom-app')} ${pc.dim('- scaffold a Vite + React + TS app')}

${pc.bold('Usage')}
  npm create chanom-app@latest ${pc.dim('[directory] [options]')}
  pnpm create chanom-app ${pc.dim('[directory] [options]')}

${pc.bold('Options')}
  ${pc.cyan('[directory]')}                 Target directory / project name (prompted if omitted)
  ${pc.cyan('--git / --no-git')}            Initialize a git repository (default: yes)
  ${pc.cyan('--commit-hooks')}              Add husky + lint-staged + commitlint (requires git)
  ${pc.cyan('--no-commit-hooks')}           Skip the commit-hooks topping
  ${pc.cyan('--agent-skills')}              Add the coding-standards skill to .claude/skills
  ${pc.cyan('--no-agent-skills')}           Skip the agent-skills topping
  ${pc.cyan('--install / --no-install')}    Install dependencies after scaffolding (default: install)
  ${pc.cyan('--pm <pnpm|npm|yarn|bun>')}    Package manager to record (default: detected)
  ${pc.cyan('-y, --yes')}                   Accept all defaults, no prompts (CI-friendly)
  ${pc.cyan('--help')}                      Show this help
  ${pc.cyan('--version')}                   Show the version`;

export class TargetNotEmpty extends Data.TaggedError('TargetNotEmpty')<{
  readonly directory: string;
}> {}

export interface RunOptions {
  /** `npm_config_user_agent`, the only package-manager signal a create-* tool has. */
  readonly userAgent?: string;
  /** Absolute path of the shipped `templates/` directory. */
  readonly templatesRoot: string;
  readonly debug?: boolean;
}

/**
 * `pnpm@11.9.0`-style field from the create launcher's user agent. Only the
 * leading token is the real launcher (`npm/?` placeholders trail it), so the
 * field is written only when it matches the resolved PM and carries a version.
 */
function packageManagerField(
  pm: PackageManager,
  userAgent: string | undefined,
): string | undefined {
  const [name, version] = (userAgent?.split(' ')[0] ?? '').split('/');
  return name === pm && version && version !== '?' ? `${pm}@${version}` : undefined;
}

/** flag wins, then `--yes`/default, otherwise ask. Building the ask effect is side-effect-free. */
function resolveConfirm(
  flag: boolean | undefined,
  yes: boolean,
  ask: Effect.Effect<boolean, Cancelled>,
): Effect.Effect<boolean, Cancelled> {
  if (flag !== undefined) return Effect.succeed(flag);
  return yes ? Effect.succeed(true) : ask;
}

const isEmptyDir = Effect.fn('cli.isEmptyDir')(function* (dir: string) {
  const fs = yield* FileSystem.FileSystem;
  if (!(yield* fs.exists(dir))) return true;
  const entries = yield* fs.readDirectory(dir);
  // A lone .git is fine (e.g. scaffolding into a freshly `git init`ed dir).
  return entries.filter((entry) => entry !== '.git').length === 0;
});

const program = (argv: readonly string[], cwd: string, options: RunOptions) =>
  Effect.gen(function* () {
    const prompter = yield* Prompter;
    const path = yield* Path.Path;

    const parsed = parseArgs(argv);
    if (!parsed.ok) {
      yield* prompter.error(parsed.message);
      return 1;
    }
    const args = parsed.args;

    if (args.help) {
      yield* prompter.message(HELP);
      return 0;
    }
    if (args.version) {
      yield* prompter.message(pkgVersion);
      return 0;
    }

    // A directory passed as a flag/positional is validated up front (the prompt
    // path validates interactively via clack).
    if (args.directory !== undefined) {
      const invalid = validateProjectName(args.directory);
      if (invalid !== undefined) {
        yield* prompter.error(invalid);
        return 1;
      }
    }

    yield* prompter.intro(pc.magenta('🧋 create-chanom-app'));

    let directory: string | undefined;

    if (args.directory !== undefined) {
      directory = toKebabCase(args.directory);
    } else if (args.yes) {
      directory = DEFAULT_NAME;
    } else {
      directory = yield* prompter.text({
        message: 'Project name?',
        placeholder: DEFAULT_NAME,
        defaultValue: DEFAULT_NAME,
        validate: validateProjectName,
      });
    }

    if (directory === undefined) {
      return 1;
    }

    const targetDir = path.resolve(cwd, directory);
    const appName = path.basename(targetDir);

    if (!(yield* isEmptyDir(targetDir))) {
      return yield* new TargetNotEmpty({ directory });
    }

    const git = yield* resolveConfirm(
      args.git,
      args.yes,
      prompter.confirm({ message: 'Initialize a git repository?', initialValue: true }),
    );
    const commitHooks = git
      ? yield* resolveConfirm(
          args.commitHooks,
          args.yes,
          prompter.confirm({
            message: 'Add commit hooks (husky + lint-staged + commitlint)?',
            initialValue: true,
          }),
        )
      : false;
    const agentSkills = yield* resolveConfirm(
      args.agentSkills,
      args.yes,
      prompter.confirm({
        message: 'Add agent coding standards (.agents/skills)?',
        initialValue: true,
      }),
    );
    const install = yield* resolveConfirm(
      args.install,
      args.yes,
      prompter.confirm({ message: 'Install dependencies now?', initialValue: true }),
    );

    const pm = args.pm ?? resolvePm({ userAgent: options.userAgent, fallback: 'pnpm' });

    yield* prompter.message(
      [
        `${pc.dim('directory')}     ${directory}`,
        `${pc.dim('package mgr')}   ${pm}`,
        `${pc.dim('git')}           ${git ? 'yes' : 'no'}`,
        `${pc.dim('commit hooks')}  ${git ? (commitHooks ? 'yes' : 'no') : pc.dim('n/a')}`,
        `${pc.dim('agent skills')}  ${agentSkills ? 'yes' : 'no'}`,
        `${pc.dim('install')}       ${install ? 'yes' : 'no'}`,
      ].join('\n'),
    );

    yield* scaffold({
      targetDir,
      appName,
      pm,
      packageManagerField: packageManagerField(pm, options.userAgent),
      git,
      commitHooks,
      agentSkills,
      install,
      templatesRoot: options.templatesRoot,
    });

    const steps = [
      ...(directory === '.' ? [] : [`cd ${directory}`]),
      ...(install ? [] : [`${pm} install`]),
      `${pm} run dev`,
    ];
    yield* prompter.outro(pc.green(`Done! Next steps:\n  ${steps.join('\n  ')}`));

    return 0;
  });

const reportError = (message: string) =>
  Effect.gen(function* () {
    const prompter = yield* Prompter;
    yield* prompter.error(message);
    return 1;
  });

/** Runs the scaffolder and returns the process exit code. */
export const run = (argv: readonly string[], cwd: string, options: RunOptions) => {
  const debug = options.debug ?? false;

  return program(argv, cwd, options).pipe(
    Effect.catchTags({
      // clack prints its own cancellation notice; exit cleanly.
      Cancelled: () => Effect.succeed(0),
      TargetNotEmpty: (e) => reportError(`${e.directory} is not empty. Aborting.`),
      InstallFailed: (e) => reportError(`Dependency installation with ${e.pm} failed.`),
    }),
    Effect.catchAll((e) => reportError(`Unexpected error: ${e.message}`)),
    Logger.withMinimumLogLevel(debug ? LogLevel.Debug : LogLevel.Info),
  );
};

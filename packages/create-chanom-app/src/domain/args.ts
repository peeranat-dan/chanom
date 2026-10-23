import type { CiJob, PackageManager } from '@chanom/internal';

import { CI_JOBS } from '@chanom/internal';

const PACKAGE_MANAGERS = ['pnpm', 'npm', 'yarn', 'bun'] as const;

const isPackageManager = (value: string): value is PackageManager =>
  (PACKAGE_MANAGERS as readonly string[]).includes(value);

const isCiJob = (value: string): value is CiJob => (CI_JOBS as readonly string[]).includes(value);

/** Flags parsed from `argv`. Undefined booleans mean "not set" (fall to prompt/default). */
export interface ParsedArgs {
  readonly directory?: string;
  readonly git?: boolean;
  readonly commitHooks?: boolean;
  readonly agentSkills?: boolean;
  readonly githubActions?: boolean;
  /** Jobs named by `--ci-jobs`, in the order given. */
  readonly ciJobs?: readonly CiJob[];
  readonly install?: boolean;
  readonly pm?: PackageManager;
  readonly yes: boolean;
  readonly help: boolean;
  readonly version: boolean;
}

export type ParseResult =
  | { readonly ok: true; readonly args: ParsedArgs }
  | { readonly ok: false; readonly message: string };

interface MutableArgs {
  directory?: string;
  git?: boolean;
  commitHooks?: boolean;
  agentSkills?: boolean;
  githubActions?: boolean;
  ciJobs?: CiJob[];
  install?: boolean;
  pm?: PackageManager;
  yes: boolean;
  help: boolean;
  version: boolean;
}

/**
 * Parses the CLI arguments, returning either the resolved flags or a
 * user-facing error message. Every flag mirrors an interactive prompt; the
 * contradictory `--no-git --commit-hooks` and `--no-github-actions --ci-jobs`
 * pairs are rejected here rather than silently reconciled.
 */
export function parseArgs(argv: readonly string[]): ParseResult {
  const args: MutableArgs = { yes: false, help: false, version: false };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    switch (arg) {
      case '-y':
      case '--yes':
        args.yes = true;
        break;
      case '-h':
      case '--help':
        args.help = true;
        break;
      case '--version':
        args.version = true;
        break;
      case '--git':
        args.git = true;
        break;
      case '--no-git':
        args.git = false;
        break;
      case '--commit-hooks':
        args.commitHooks = true;
        break;
      case '--no-commit-hooks':
        args.commitHooks = false;
        break;
      case '--agent-skills':
        args.agentSkills = true;
        break;
      case '--no-agent-skills':
        args.agentSkills = false;
        break;
      case '--github-actions':
        args.githubActions = true;
        break;
      case '--no-github-actions':
        args.githubActions = false;
        break;
      case '--ci-jobs': {
        const value = argv[++i];
        if (value === undefined) return { ok: false, message: '--ci-jobs requires a value.' };
        const jobs = value.split(',').map((job) => job.trim());
        const unknown = jobs.find((job) => !isCiJob(job));
        if (unknown !== undefined) {
          return {
            ok: false,
            message: `Unknown CI job "${unknown}". Use any of: ${CI_JOBS.join(', ')}.`,
          };
        }
        args.ciJobs = jobs.filter(isCiJob);
        break;
      }
      case '--install':
        args.install = true;
        break;
      case '--no-install':
        args.install = false;
        break;
      case '--pm': {
        const value = argv[++i];
        if (value === undefined) return { ok: false, message: '--pm requires a value.' };
        if (!isPackageManager(value)) {
          return {
            ok: false,
            message: `Unknown package manager "${value}". Use one of: ${PACKAGE_MANAGERS.join(', ')}.`,
          };
        }
        args.pm = value;
        break;
      }
      default:
        if (arg.startsWith('-')) return { ok: false, message: `Unknown option: ${arg}` };
        if (args.directory !== undefined) {
          return { ok: false, message: `Unexpected extra argument: ${arg}` };
        }
        args.directory = arg;
    }
  }

  if (args.git === false && args.commitHooks === true) {
    return {
      ok: false,
      message: '--commit-hooks requires a git repo. Remove --no-git or --commit-hooks.',
    };
  }

  if (args.githubActions === false && args.ciJobs !== undefined) {
    return {
      ok: false,
      message:
        '--ci-jobs needs the github-actions topping. Remove --no-github-actions or --ci-jobs.',
    };
  }

  return { ok: true, args };
}

/**
 * Validates a project name / target directory. Returns an error message to
 * reject it, or `undefined` when it is acceptable. `.` (scaffold into the
 * current directory) is allowed. Accepts `undefined` so it can be handed
 * straight to a prompt, where an empty submission arrives as `undefined`.
 */
export function validateProjectName(name: string | undefined): string | undefined {
  if (name === undefined || name.trim() === '') return 'Please enter a project name.';
  if (name === '.') return undefined;
  if (!/^[a-z0-9._-]+$/i.test(name)) {
    return 'Use letters, numbers, dots, dashes, and underscores only.';
  }
  if (name.startsWith('.')) return 'Name cannot start with a dot.';
  return undefined;
}

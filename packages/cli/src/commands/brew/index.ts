import { FileSystem, Path } from '@effect/platform';
import { Data, Effect, Option } from 'effect';
import pc from 'picocolors';

import type { PackageManager } from '../../domain/package-manager.ts';

import { bundledVersions } from '../../bundled-versions.ts';
import { isEsm, type Pkg } from '../../domain/pkg.ts';
import { Git } from '../../services/git.ts';
import { PackageInstaller } from '../../services/package-installer.ts';
import { Prompter } from '../../services/prompter.ts';
import { detectPm } from '../../utils/detect-pm.ts';
import { readPkg, writePkg } from '../../utils/pkg-file.ts';
import * as addCommitlint from '../add-commitlint/index.ts';
import * as addHusky from '../add-husky/index.ts';
import * as addKnip from '../add-knip/index.ts';
import * as addLintStaged from '../add-lint-staged/index.ts';
import * as addOxfmt from '../add-oxfmt/index.ts';
import * as addOxlint from '../add-oxlint/index.ts';
import {
  appendGitignoreEntry,
  hasGitignoreEntry,
  planPackages,
  selectedFormatters,
  selectedLinters,
  type Sweetness,
  type Topping,
  wantsLintStaged,
} from './logic.ts';

export class NotAtRepoRoot extends Data.TaggedError('NotAtRepoRoot')<{
  readonly cwd: string;
  readonly root: string;
}> {}

const ensureGitRepo = Effect.fn('brew.ensureGitRepo')(function* (cwd: string) {
  const git = yield* Git;
  if (yield* git.isRepo(cwd)) {
    yield* Effect.logDebug('git repository already present');
    return;
  }

  const prompter = yield* Prompter;
  const s = yield* prompter.spinner('Git not found, initializing repository...');
  yield* git.init(cwd);
  yield* s.stop('Git initialized');
});

const ensureGitIgnore = Effect.fn('brew.ensureGitIgnore')(function* (cwd: string) {
  const git = yield* Git;
  const prompter = yield* Prompter;

  const existing = yield* git
    .readGitignore(cwd)
    .pipe(
      Effect.catchTag('SystemError', (e) =>
        e.reason === 'NotFound' ? Effect.succeed(undefined) : Effect.fail(e),
      ),
    );

  if (existing !== undefined && hasGitignoreEntry(existing, 'node_modules')) {
    yield* Effect.logDebug('node_modules already present in .gitignore');
    return;
  }

  const s = yield* prompter.spinner(
    existing === undefined ? 'Creating .gitignore...' : 'Adding node_modules to .gitignore...',
  );
  yield* git
    .writeGitignore(cwd, appendGitignoreEntry(existing ?? '', 'node_modules'))
    .pipe(Effect.tapError(() => s.stop(pc.red('Could not update .gitignore'))));
  yield* s.stop(existing === undefined ? '.gitignore created' : 'node_modules added to .gitignore');
});

const askRecipe = Effect.fn('brew.askRecipe')(function* () {
  const prompter = yield* Prompter;

  const toppings = yield* prompter.multiselect<Topping>({
    message: 'Which toppings would you like?',
    options: [
      { value: 'oxlint', label: 'oxlint', hint: 'fast Rust-based linter' },
      { value: 'oxfmt', label: 'oxfmt', hint: 'fast Rust-based formatter' },
      { value: 'knip', label: 'knip', hint: 'dead code remover' },
    ],
    required: false,
  });

  const sweetness = yield* prompter.select<Sweetness>({
    message: 'How sweet would you like it?',
    options: [
      { value: 'light', label: 'light', hint: 'warn only, no blocking' },
      {
        value: 'medium',
        label: 'medium',
        hint: 'block on commit (husky + lint-staged + commitlint)',
      },
    ],
  });

  return { toppings, sweetness };
});

const installPackages = Effect.fn('brew.installPackages')(function* (
  pm: PackageManager,
  cwd: string,
  packages: readonly string[],
) {
  if (packages.length === 0) {
    yield* Effect.logDebug('no packages to install');
    return;
  }

  const prompter = yield* Prompter;
  const installer = yield* PackageInstaller;
  const s = yield* prompter.spinner(`Installing ${packages.join(', ')}...`);
  yield* installer
    .installDev(pm, cwd, packages)
    .pipe(Effect.tapError(() => s.stop(pc.red('Package installation failed'))));
  yield* s.stop('Packages installed');
});

const applyToppings = Effect.fn('brew.applyToppings')(function* (
  cwd: string,
  esm: boolean,
  pkg: Pkg,
  toppings: readonly Topping[],
) {
  let updated = pkg;

  if (toppings.includes('oxlint')) {
    updated = yield* addOxlint.apply(cwd, esm, updated);
  }
  if (toppings.includes('oxfmt')) {
    updated = yield* addOxfmt.apply(cwd, esm, updated);
  }
  if (toppings.includes('knip')) {
    updated = yield* addKnip.apply(cwd, esm, updated);
  }

  return updated;
});

const persistScripts = Effect.fn('brew.persistScripts')(function* (
  pkgPath: string,
  pkg: Pkg,
  updated: Pkg,
) {
  if (JSON.stringify(updated.scripts ?? {}) === JSON.stringify(pkg.scripts ?? {})) {
    yield* Effect.logDebug('scripts unchanged, skipping package.json write');
  } else {
    yield* Effect.logDebug(`writing updated scripts to ${pkgPath}`);
    yield* writePkg(pkgPath, updated);
  }
});

/**
 * Fails when medium sweetness is chosen away from the git work-tree root:
 * husky can only install hooks from the directory that holds `.git`, so
 * running it in e.g. a workspace package would leave hooks that never fire.
 */
const ensureRepoRootForHooks = Effect.fn('brew.ensureRepoRootForHooks')(function* (
  cwd: string,
  sweetness: Sweetness,
) {
  if (sweetness !== 'medium') return;

  const git = yield* Git;
  const prefix = yield* git.prefix(cwd);
  if (Option.isNone(prefix) || prefix.value === '') return;

  const root = yield* git.root(cwd);
  return yield* new NotAtRepoRoot({ cwd, root: Option.getOrElse(root, () => cwd) });
});

const setupCommitGate = Effect.fn('brew.setupCommitGate')(function* (
  cwd: string,
  pm: PackageManager,
  toppings: readonly Topping[],
  sweetness: Sweetness,
) {
  if (sweetness !== 'medium') return;

  const fs = yield* FileSystem.FileSystem;
  const path = yield* Path.Path;
  const prompter = yield* Prompter;

  const huskyExisted = yield* fs.exists(path.join(cwd, '.husky'));
  yield* addHusky.apply(cwd, pm);

  if (wantsLintStaged(toppings)) {
    yield* addLintStaged.apply(
      cwd,
      selectedLinters(toppings),
      selectedFormatters(toppings),
      !huskyExisted,
    );
  } else {
    yield* prompter.warn('No linters or formatters selected - skipping lint-staged');
    // `husky init` seeds `.husky/pre-commit` with `npm test`, which would fail
    // every commit in projects without a test script.
    const seededHook = path.join(cwd, '.husky', 'pre-commit');
    if (!huskyExisted && (yield* fs.exists(seededHook))) {
      yield* fs.remove(seededHook);
    }
  }

  yield* addCommitlint.apply(cwd, pm);
});

const commitChanges = Effect.fn('brew.commitChanges')(function* (cwd: string) {
  const git = yield* Git;
  const prompter = yield* Prompter;
  const s = yield* prompter.spinner('Committing changes...');

  if (!(yield* git.hasIdentity(cwd))) {
    yield* git.setLocalIdentity(cwd, 'Chanom', 'chanom@local');
  }

  yield* git.stageAll(cwd);

  if (!(yield* git.hasStagedChanges(cwd))) {
    yield* s.stop('Nothing to commit, skipping');
    return;
  }

  const result = yield* git.commit(cwd, 'chore: setup chanom configuration');
  if (result.ok) {
    yield* s.stop('Changes committed');
    return;
  }

  yield* s.stop(pc.yellow('Could not commit changes automatically'));
  const detail = result.stderr || result.stdout;
  yield* prompter.warn(
    `${detail ? detail + '\n' : ''}Your files are staged - commit them manually when ready.`,
  );
});

export const brew = (cwd: string = process.cwd()) =>
  Effect.gen(function* () {
    const prompter = yield* Prompter;

    yield* prompter.intro(pc.magenta("🧋 Chanom - Let's brew your project!"));

    yield* ensureGitRepo(cwd);
    yield* ensureGitIgnore(cwd);

    const pm = yield* detectPm(cwd);
    yield* Effect.logDebug(`detected package manager: ${pm}`);

    const { pkg, pkgPath } = yield* readPkg(cwd);
    const { toppings, sweetness } = yield* askRecipe();
    yield* Effect.logDebug(
      `recipe: toppings=[${toppings.join(', ')}] sweetness=${sweetness} esm=${isEsm(pkg)}`,
    );
    yield* ensureRepoRootForHooks(cwd, sweetness);

    const packages = planPackages(pkg, toppings, sweetness, bundledVersions);
    yield* Effect.logDebug(
      `planned packages: ${packages.length > 0 ? packages.join(', ') : '(none)'}`,
    );
    yield* installPackages(pm, cwd, packages);

    const updated = yield* applyToppings(cwd, isEsm(pkg), pkg, toppings);
    yield* persistScripts(pkgPath, pkg, updated);
    yield* setupCommitGate(cwd, pm, toppings, sweetness);
    yield* commitChanges(cwd);

    yield* prompter.outro(
      pc.green(
        `Your Chanom with ${toppings.join(', ')} toppings and ${sweetness} sweetness is ready! Enjoy! 🧋`,
      ),
    );
  });

import { intro, log, multiselect, outro, select, spinner } from '@clack/prompts';
import { FileSystem, Path } from '@effect/platform';
import { Data, Effect } from 'effect';
import pc from 'picocolors';

import { detectPm, type PackageManager } from '../../utils/detect-pm.ts';
import * as git from '../../utils/git.ts';
import { installDev } from '../../utils/install.ts';
import { isEsm, PkgNotFound, readPkg } from '../../utils/pkg.ts';
import * as addCommitlint from '../add-commitlint/index.ts';
import * as addHusky from '../add-husky/index.ts';
import * as addKnip from '../add-knip/index.ts';
import * as addLintStaged from '../add-lint-staged/index.ts';
import * as addOxfmt from '../add-oxfmt/index.ts';
import * as addOxlint from '../add-oxlint/index.ts';

type Topping = 'oxlint' | 'oxfmt' | 'knip';
type Sweetness = 'light' | 'medium';

class Cancelled extends Data.TaggedError('Cancelled') {}
class InstallFailed extends Data.TaggedError('InstallFailed')<{
  pm: PackageManager;
}> {}

const prompt = <T>(make: () => Promise<T | symbol>) =>
  Effect.promise(make).pipe(
    Effect.filterOrFail(
      (r): r is T => typeof r !== 'symbol',
      () => new Cancelled(),
    ),
  );

export const brew = (cwd = process.cwd()) =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem;
    const path = yield* Path.Path;

    intro(pc.magenta("🧋 Chanom - Let's brew your project!"));

    const isGitRepo = yield* git.isGitRepo(cwd);

    if (!isGitRepo) {
      const s = spinner();
      s.start('Git not found, initializing repository...');
      yield* git.init(cwd);
      yield* git.writeGitignore(cwd);
      s.stop('Git initialized');
    }

    const pm = detectPm(cwd);

    const packageJsonPath = path.join(cwd, 'package.json');
    const packageJsonExists = yield* fs.exists(packageJsonPath);

    if (packageJsonExists === false) {
      return yield* new PkgNotFound({ cwd });
    }

    const toppings = yield* prompt(() =>
      multiselect<Topping>({
        message: 'Which toppings would you like?',
        options: [
          { value: 'oxlint', label: 'oxlint', hint: 'fast Rust-based linter' },
          { value: 'oxfmt', label: 'oxfmt', hint: 'fast Rust-based formatter' },
          { value: 'knip', label: 'knip', hint: 'dead code remover' },
        ],
        required: false,
      }),
    );

    const sweetness = yield* prompt(() =>
      select<Sweetness>({
        message: 'How sweet would you like it?',
        options: [
          { value: 'light', label: 'light', hint: 'warn only, no blocking' },
          {
            value: 'medium',
            label: 'medium',
            hint: 'block on commit (husky + lint-staged + commitlint)',
          },
        ],
      }),
    );

    const { pkg, pkgPath } = yield* readPkg(cwd);

    const esm = isEsm(pkg);

    const packages: string[] = [];

    if (toppings.includes('oxlint')) {
      packages.push(...addOxlint.getPackages(pkg));
    }

    if (toppings.includes('oxfmt')) {
      packages.push(...addOxfmt.getPackages(pkg));
    }

    if (toppings.includes('knip')) {
      packages.push(...addKnip.getPackages(pkg));
    }

    if (sweetness === 'medium') {
      packages.push(
        ...addHusky.getPackages(pkg),
        ...addLintStaged.getPackages(pkg),
        ...addCommitlint.getPackages(pkg),
      );
    }

    if (packages.length > 0) {
      const s = spinner();
      const uniquePackages = Array.from(new Set(packages));
      s.start(`Installing ${uniquePackages.join(', ')}...`);
      const installResult = yield* installDev(pm, cwd, ...uniquePackages);

      if (!installResult) {
        s.stop(pc.red('Package installation failed'));
        return yield* new InstallFailed({ pm });
      }

      s.stop('Packages installed');
    }

    // Toppings mutate `pkg.scripts` in place; write package.json once after all run.
    const scriptsBefore = JSON.stringify(pkg.scripts ?? {});

    if (toppings.includes('oxlint')) {
      yield* addOxlint.apply(cwd, esm, pkg);
    }
    if (toppings.includes('oxfmt')) {
      yield* addOxfmt.apply(cwd, esm, pkg);
    }
    if (toppings.includes('knip')) {
      yield* addKnip.apply(cwd, esm, pkg);
    }

    if (JSON.stringify(pkg.scripts ?? {}) !== scriptsBefore) {
      yield* fs.writeFileString(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
    }

    if (sweetness === 'medium') {
      const huskyPath = path.join(cwd, '.husky');
      const huskyExisted = yield* fs.exists(huskyPath);
      yield* addHusky.apply(cwd, pm);
      yield* addLintStaged.apply(
        cwd,
        toppings.filter((t): t is addLintStaged.Linter =>
          (['oxlint'] as const).includes(t as addLintStaged.Linter),
        ),
        toppings.filter((t): t is addLintStaged.Formatter =>
          (['oxfmt'] as const).includes(t as addLintStaged.Formatter),
        ),
        !huskyExisted,
      );
      yield* addCommitlint.apply(cwd, pm);
    }

    const s2 = spinner();
    s2.start('Committing changes...');

    const hasGitIdentity = yield* git.hasIdentity(cwd);

    if (hasGitIdentity === false) {
      yield* git.setLocalIdentity(cwd, 'Chanom', 'chanom@local');
    }

    yield* git.stageAll(cwd);

    const hasStagedChanges = yield* git.hasStagedChanges(cwd);

    if (hasStagedChanges) {
      const result = yield* git.commit(cwd, 'chore: setup chanom configuration');
      if (result.ok) {
        s2.stop('Changes committed');
      } else {
        s2.stop(pc.yellow('Could not commit changes automatically'));
        const detail = result.stderr || result.stdout;
        log.warn(
          `${detail ? detail + '\n' : ''}Your files are staged - commit them manually when ready.`,
        );
      }
    } else {
      s2.stop('Nothing to commit, skipping');
    }

    outro(
      pc.green(
        `Your Chanom with ${toppings.join(', ')} toppings and ${sweetness} sweetness is ready! Enjoy! 🧋`,
      ),
    );
  });

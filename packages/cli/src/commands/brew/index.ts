import { FileSystem, Path } from '@effect/platform';
import { Effect } from 'effect';
import pc from 'picocolors';

import { bundledVersions } from '../../bundled-versions.ts';
import { isEsm } from '../../domain/pkg.ts';
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
  planPackages,
  selectedFormatters,
  selectedLinters,
  type Sweetness,
  type Topping,
} from './logic.ts';

export const brew = (cwd: string = process.cwd()) =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem;
    const path = yield* Path.Path;
    const prompter = yield* Prompter;
    const git = yield* Git;
    const installer = yield* PackageInstaller;

    yield* prompter.intro(pc.magenta("🧋 Chanom - Let's brew your project!"));

    if (!(yield* git.isRepo(cwd))) {
      const s = yield* prompter.spinner('Git not found, initializing repository...');
      yield* git.init(cwd);
      yield* git.writeGitignore(cwd);
      yield* s.stop('Git initialized');
    }

    const pm = yield* detectPm(cwd);
    const { pkg, pkgPath } = yield* readPkg(cwd);
    const esm = isEsm(pkg);

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

    const packages = planPackages(pkg, toppings, sweetness, bundledVersions);

    if (packages.length > 0) {
      const s = yield* prompter.spinner(`Installing ${packages.join(', ')}...`);
      yield* installer
        .installDev(pm, cwd, packages)
        .pipe(Effect.tapError(() => s.stop(pc.red('Package installation failed'))));
      yield* s.stop('Packages installed');
    }

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

    if (JSON.stringify(updated.scripts ?? {}) !== JSON.stringify(pkg.scripts ?? {})) {
      yield* writePkg(pkgPath, updated);
    }

    if (sweetness === 'medium') {
      const huskyExisted = yield* fs.exists(path.join(cwd, '.husky'));
      yield* addHusky.apply(cwd, pm);
      yield* addLintStaged.apply(
        cwd,
        selectedLinters(toppings),
        selectedFormatters(toppings),
        !huskyExisted,
      );
      yield* addCommitlint.apply(cwd, pm);
    }

    const s = yield* prompter.spinner('Committing changes...');

    if (!(yield* git.hasIdentity(cwd))) {
      yield* git.setLocalIdentity(cwd, 'Chanom', 'chanom@local');
    }

    yield* git.stageAll(cwd);

    if (yield* git.hasStagedChanges(cwd)) {
      const result = yield* git.commit(cwd, 'chore: setup chanom configuration');
      if (result.ok) {
        yield* s.stop('Changes committed');
      } else {
        yield* s.stop(pc.yellow('Could not commit changes automatically'));
        const detail = result.stderr || result.stdout;
        yield* prompter.warn(
          `${detail ? detail + '\n' : ''}Your files are staged - commit them manually when ready.`,
        );
      }
    } else {
      yield* s.stop('Nothing to commit, skipping');
    }

    yield* prompter.outro(
      pc.green(
        `Your Chanom with ${toppings.join(', ')} toppings and ${sweetness} sweetness is ready! Enjoy! 🧋`,
      ),
    );
  });

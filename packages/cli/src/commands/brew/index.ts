import { intro, log, multiselect, outro, select, spinner } from '@clack/prompts';
import pc from 'picocolors';

import { detectPm } from '../../utils/detect-pm.ts';
import * as git from '../../utils/git.ts';
import { installDev } from '../../utils/install.ts';
import { isEsm, readPkg } from '../../utils/pkg.ts';
import * as addCommitlint from '../add-commitlint/index.ts';
import * as addHusky from '../add-husky/index.ts';
import * as addKnip from '../add-knip/index.ts';
import * as addLintStaged from '../add-lint-staged/index.ts';
import * as addOxfmt from '../add-oxfmt/index.ts';
import * as addOxlint from '../add-oxlint/index.ts';

type Topping = 'oxlint' | 'oxfmt' | 'knip';
type Sweetness = 'light' | 'medium';

export async function brew(cwd = process.cwd()): Promise<void> {
  intro(pc.magenta("🧋 Chanom - Let's brew your project!"));

  if (!git.isGitRepo(cwd)) {
    const s = spinner();
    s.start('Git not found, initializing repository...');
    git.init(cwd);
    git.writeGitignore(cwd);
    s.stop('Git initialized');
  }

  const pm = detectPm(cwd);

  const toppings = await multiselect<Topping>({
    message: 'Which toppings would you like?',
    options: [
      { value: 'oxlint', label: 'oxlint', hint: 'fast Rust-based linter' },
      { value: 'oxfmt', label: 'oxfmt', hint: 'fast Rust-based formatter' },
      { value: 'knip', label: 'knip', hint: 'dead code remover' },
    ],
    required: false,
  });

  if (typeof toppings === 'symbol') process.exit(0);

  const sweetness = await select<Sweetness>({
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

  if (typeof sweetness === 'symbol') process.exit(0);

  const { pkg } = readPkg(cwd);
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
    installDev(pm, cwd, ...uniquePackages);
    s.stop('Packages installed');
  }

  if (toppings.includes('oxlint')) addOxlint.apply(cwd, esm);
  if (toppings.includes('oxfmt')) addOxfmt.apply(cwd, esm);
  if (toppings.includes('knip')) addKnip.apply(cwd, esm);
  if (sweetness === 'medium') {
    addHusky.apply(cwd, pm);
    addLintStaged.apply(
      cwd,
      toppings.filter((t): t is addLintStaged.Linter =>
        (['oxlint'] as const).includes(t as addLintStaged.Linter),
      ),
      toppings.filter((t): t is addLintStaged.Formatter =>
        (['oxfmt'] as const).includes(t as addLintStaged.Formatter),
      ),
    );
    addCommitlint.apply(cwd);
  }

  const s2 = spinner();
  s2.start('Committing changes...');

  if (!git.hasIdentity(cwd)) {
    git.setLocalIdentity(cwd, 'Chanom', 'chanom@local');
  }

  git.stageAll(cwd);

  if (git.hasStagedChanges(cwd)) {
    const result = git.commit(cwd, 'chore: setup chanom configuration');
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
}

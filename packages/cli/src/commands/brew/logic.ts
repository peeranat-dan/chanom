import type { Pkg } from '../../domain/pkg.ts';
import type { ToolVersions } from '../../domain/versions.ts';
import type { Formatter, Linter } from '../add-lint-staged/logic.ts';

import * as addCommitlint from '../add-commitlint/logic.ts';
import * as addHusky from '../add-husky/logic.ts';
import * as addKnip from '../add-knip/logic.ts';
import * as addLintStaged from '../add-lint-staged/logic.ts';
import * as addOxfmt from '../add-oxfmt/logic.ts';
import * as addOxlint from '../add-oxlint/logic.ts';

export type Topping = 'oxlint' | 'oxfmt' | 'knip';
export type Sweetness = 'light' | 'medium';

/** Deduplicated list of packages to install for the chosen toppings and sweetness. */
export function planPackages(
  pkg: Pkg,
  toppings: readonly Topping[],
  sweetness: Sweetness,
  versions: ToolVersions,
): string[] {
  const packages: string[] = [];

  if (toppings.includes('oxlint')) {
    packages.push(...addOxlint.getPackages(pkg, versions));
  }
  if (toppings.includes('oxfmt')) {
    packages.push(...addOxfmt.getPackages(pkg, versions));
  }
  if (toppings.includes('knip')) {
    packages.push(...addKnip.getPackages(pkg, versions));
  }
  if (sweetness === 'medium') {
    packages.push(
      ...addHusky.getPackages(pkg),
      ...addLintStaged.getPackages(pkg),
      ...addCommitlint.getPackages(pkg),
    );
  }

  return [...new Set(packages)];
}

export function selectedLinters(toppings: readonly Topping[]): Linter[] {
  return toppings.filter((t): t is Linter => t === 'oxlint');
}

export function selectedFormatters(toppings: readonly Topping[]): Formatter[] {
  return toppings.filter((t): t is Formatter => t === 'oxfmt');
}

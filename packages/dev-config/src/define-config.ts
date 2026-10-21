import type { KnipConfig } from 'knip';
import type { OxfmtConfig } from 'oxfmt';
import type { OxlintConfig } from 'oxlint';

/**
 * Identity helpers like the tools' own `defineConfig`, but with a `const` type
 * parameter so the emitted .d.ts keeps literal values (`tabWidth: 2`, the exact
 * glob list) instead of widening them to `number` / `string[]`. Consumers can
 * then hover an import to see exactly what the shared config sets.
 */
export const defineOxlintConfig = <const T extends OxlintConfig>(config: T): T => config;

export const defineOxfmtConfig = <const T extends OxfmtConfig>(config: T): T => config;

export const defineKnipConfig = <const T extends KnipConfig>(config: T): T => config;

import type { Contribution } from '../domain/contribution.ts';

/**
 * Renders `vite.config.ts` from the folded contribution's Vite imports and
 * plugin list. Generated (not a static template) so a future topping can add
 * plugins without a substitution engine — the baseline output is the invariant
 * `createViteConfig({ plugins: [react()] })`.
 */
export function renderViteConfig(contribution: Contribution): string {
  const imports = [
    "import { createViteConfig } from '@chanom/vite-config';",
    ...contribution.viteImports,
  ].join('\n');
  const plugins = contribution.vitePlugins.join(', ');

  return `${imports}\n\nexport default createViteConfig({ plugins: [${plugins}] });\n`;
}

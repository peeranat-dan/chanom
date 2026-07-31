// Local tsconfig extending the community @tsconfig/vite-react base (one devDep),
// generated (per the baseline-contents decision) so a topping could vary it
// without a substitution engine. Invariant in v1.
const TSCONFIG = {
  extends: '@tsconfig/vite-react/tsconfig.json',
  compilerOptions: {
    types: ['vite/client', 'vitest/globals'],
  },
  include: ['src'],
};

/** Renders the generated `tsconfig.json` as a string. */
export function buildTsconfig(): string {
  return JSON.stringify(TSCONFIG, null, 2) + '\n';
}

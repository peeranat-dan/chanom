// Local tsconfig extending the shared @chanom/tsconfig Vite + React preset (one
// devDep). Generated rather than copied so a topping could vary it without a
// substitution engine; no topping does yet.
const TSCONFIG = {
  extends: '@chanom/tsconfig/vite-react.json',
  compilerOptions: {
    types: ['vite/client', 'vitest/globals'],
  },
  include: ['src'],
};

/** Renders the generated `tsconfig.json` as a string. */
export function buildTsconfig(): string {
  return JSON.stringify(TSCONFIG, null, 2) + '\n';
}

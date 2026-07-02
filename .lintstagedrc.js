/**
 * @type {import('lint-staged').Configuration}
 */
export default {
  '*': ['pnpm lint:fix --no-error-on-unmatched-pattern', 'pnpm format'],
};

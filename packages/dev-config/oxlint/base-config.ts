import { defineConfig } from 'oxlint';

export default defineConfig({
  plugins: ['typescript'],
  categories: {
    correctness: 'error',
  },
  rules: {
    'no-explicit-any': 'error',
    'no-unused-expressions': 'off',
    'no-this-alias': 'off',
    'no-console': 'error',
    'no-unused-vars': [
      'error',
      {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_',
      },
    ],
    /**
     * TypeScript Rules
     */
    'typescript/no-deprecated': 'warn',
    'typescript/consistent-type-definitions': 'error',
    'typescript/consistent-type-imports': 'error',
  },
  ignorePatterns: ['**/node_modules/**', '**/.turbo/**'],
});

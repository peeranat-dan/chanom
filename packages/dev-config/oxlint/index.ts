import { defineConfig } from 'oxlint';

import baseConfig from './base-config.ts';

export default defineConfig({
  extends: [baseConfig],
  plugins: ['react', 'jsx-a11y'],
  categories: {
    correctness: 'error',
  },
  rules: {
    'no-restricted-imports': [
      'error',
      {
        paths: [
          {
            name: 'react',
            importNames: ['default'],
            message: 'Do not import React as default. Use named imports instead.',
          },
          {
            name: 'zod',
            importNames: ['default'],
            message: 'Do not import Zod as default. Use named imports instead.',
          },
        ],
      },
    ],
    /**
     * React Rules
     */
    'react-hooks/exhaustive-deps': 'warn',
    'react/rules-of-hooks': 'error',
  },
  ignorePatterns: ['**/env.d.ts', '**/storybook-static/**', '**/dist/**', '**/build/**'],
});

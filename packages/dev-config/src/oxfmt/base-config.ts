import { defineConfig } from 'oxfmt';

export default defineConfig({
  useTabs: false,
  tabWidth: 2,
  printWidth: 100,
  singleQuote: true,
  jsxSingleQuote: false,
  quoteProps: 'as-needed',
  trailingComma: 'all',
  semi: true,
  arrowParens: 'always',
  bracketSameLine: false,
  bracketSpacing: true,
  ignorePatterns: [
    '.agents/skills/**/*.md',
    '.claude/skills/**/*.md',
    '**/dist/**',
    '**/node_modules/**',
    '**/build/**',
    '**/.turbo/**',
    '**/storybook-static/**',
  ],
  overrides: [
    {
      files: ['**/*.yaml'],
      options: {
        singleQuote: true,
      },
    },
  ],
  sortImports: {
    groups: [
      'type-import',
      ['value-builtin', 'value-external'],
      'type-internal',
      'value-internal',
      ['type-parent', 'type-sibling', 'type-index'],
      ['value-parent', 'value-sibling', 'value-index'],
      'unknown',
    ],
  },
});

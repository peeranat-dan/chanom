import baseConfig from '@chanom/dev-config/oxlint/base';
import { defineConfig } from 'oxlint';

export default defineConfig({
  extends: [baseConfig],
  plugins: ['typescript', 'unicorn', 'oxc'],
  categories: {
    correctness: 'error',
  },
  rules: {},
  env: {
    builtin: true,
  },
});

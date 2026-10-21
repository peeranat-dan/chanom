import { defineKnipConfig } from '../define-config.js';

export default defineKnipConfig({
  ignore: ['**/dist/**', '**/build/**', '**/.turbo/**', '**/CHANGELOG.md'],
  ignoreDependencies: ['@chanom/dev-config'],
  ignoreExportsUsedInFile: true,
});

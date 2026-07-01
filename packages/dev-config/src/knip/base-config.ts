import type { KnipConfig } from 'knip';

export default {
  ignore: ['**/dist/**', '**/build/**', '**/.turbo/**', '**/CHANGELOG.md'],
  ignoreDependencies: ['@chanom/dev-config'],
  ignoreExportsUsedInFile: true,
} satisfies KnipConfig;

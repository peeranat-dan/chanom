import type { KnipConfig } from 'knip';

import baseConfig from './base-config.js';

export default {
  ...baseConfig,
  entry: ['index.html', 'src/main.tsx'],
  project: ['src/**/*.{ts,tsx}'],
  ignore: [...(baseConfig.ignore ?? []), '**/*.stories.tsx', 'src/vite-env.d.ts'],
  ignoreDependencies: [
    ...(baseConfig.ignoreDependencies ?? []),
    '@types/react',
    '@types/react-dom',
  ],
  vite: true,
} satisfies KnipConfig;

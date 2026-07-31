export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'scope-enum': [
      2,
      'always',
      [
        'ana', // packages/analytics
        'cli', // packages/cli
        'cca', // packages/create-chanom-app
        'dc', // packages/dev-config
        'internal', // packages/internal
        'logger', // packages/logger
        'vc', // packages/vite-config
        'vscode', // .vscode
      ],
    ],
  },
};

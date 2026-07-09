export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'scope-enum': [
      2,
      'always',
      [
        'ana', // packages/analytics
        'cli', // packages/cli
        'dc', // packages/dev-config
        'vc', // packages/vite-config
        'vscode', // .vscode
      ],
    ],
  },
};

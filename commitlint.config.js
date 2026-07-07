export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'scope-enum': [2, 'always', ['ana', 'cli', 'dc', 'vc', 'vscode']],
  },
};

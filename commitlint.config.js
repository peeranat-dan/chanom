export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'scope-enum': [2, 'always', ['cli', 'dc', 'vc', 'vscode']],
  },
};

import { defineRule } from '@oxlint/plugins';

import { getBasename, isHookFilename, isInHooksDir } from '../domain/hooks.js';

export default defineRule({
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Require files under a `hooks` folder to be named with the `use` prefix.',
    },
    messages: {
      missingUsePrefix: 'Hook file "{{basename}}" must start with "use" (e.g. "use-{{basename}}").',
    },
  },
  create(context) {
    const { filename } = context;
    if (!isInHooksDir(filename) || isHookFilename(filename)) {
      return {};
    }
    return {
      Program(node) {
        context.report({
          node,
          messageId: 'missingUsePrefix',
          data: { basename: getBasename(filename) },
        });
      },
    };
  },
});

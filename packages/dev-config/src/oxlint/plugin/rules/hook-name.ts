import type { ESTree } from '@oxlint/plugins';

import { defineRule } from '@oxlint/plugins';

import { isHookName, isInHooksDir } from '../domain/hooks.js';

const FUNCTION_INIT_TYPES: ReadonlySet<string> = new Set([
  'ArrowFunctionExpression',
  'FunctionExpression',
]);

/** Identifiers of the functions a declaration exports, ignoring non-function values and types. */
const getExportedFunctionIds = (
  declaration: ESTree.Node | null | undefined,
): readonly ESTree.BindingIdentifier[] => {
  if (declaration?.type === 'FunctionDeclaration') {
    return declaration.id ? [declaration.id] : [];
  }
  if (declaration?.type === 'VariableDeclaration') {
    return declaration.declarations.flatMap((declarator) =>
      declarator.id.type === 'Identifier' &&
      declarator.init &&
      FUNCTION_INIT_TYPES.has(declarator.init.type)
        ? [declarator.id]
        : [],
    );
  }
  return [];
};

export default defineRule({
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Require functions exported from a `hooks` folder to be named with the `use` prefix.',
    },
    messages: {
      missingUsePrefix: 'Hook "{{name}}" must start with "use" (e.g. "use{{capitalized}}").',
    },
  },
  create(context) {
    if (!isInHooksDir(context.filename)) {
      return {};
    }
    const check = (declaration: ESTree.Node | null | undefined): void => {
      for (const id of getExportedFunctionIds(declaration)) {
        if (!isHookName(id.name)) {
          context.report({
            node: id,
            messageId: 'missingUsePrefix',
            data: {
              name: id.name,
              capitalized: id.name.charAt(0).toUpperCase() + id.name.slice(1),
            },
          });
        }
      }
    };
    return {
      ExportNamedDeclaration(node) {
        check(node.declaration);
      },
      ExportDefaultDeclaration(node) {
        check(node.declaration);
      },
    };
  },
});

import { RuleTester } from 'oxlint/plugins-dev';
import { describe, it } from 'vitest';

import hookName from '../../../../src/oxlint/plugin/rules/hook-name.ts';

RuleTester.describe = describe;
RuleTester.it = it;

const filename = '/app/src/hooks/use-foo.ts';

new RuleTester().run('hook-name', hookName, {
  valid: [
    { code: 'export function useFoo() {}', filename },
    { code: 'export const useFoo = () => {};', filename },
    { code: 'export const useFoo = function () {};', filename },
    { code: 'export default function useFoo() {}', filename },
    { code: 'export default () => {};', filename },
    { code: 'export const LIMIT = 10;', filename },
    { code: 'function helper() {} export const useFoo = () => helper();', filename },
    { code: 'export function foo() {}', filename: '/app/src/utils/foo.ts' },
  ],
  invalid: [
    {
      code: 'export function foo() {}',
      filename,
      errors: [{ messageId: 'missingUsePrefix', data: { name: 'foo', capitalized: 'Foo' } }],
    },
    {
      code: 'export const user = () => {};',
      filename,
      errors: [{ messageId: 'missingUsePrefix', data: { name: 'user', capitalized: 'User' } }],
    },
    {
      code: 'export default function foo() {}',
      filename,
      errors: [{ messageId: 'missingUsePrefix', data: { name: 'foo', capitalized: 'Foo' } }],
    },
    {
      code: 'export const a = () => {}, useB = () => {}, c = function () {};',
      filename,
      errors: [
        { messageId: 'missingUsePrefix', data: { name: 'a', capitalized: 'A' } },
        { messageId: 'missingUsePrefix', data: { name: 'c', capitalized: 'C' } },
      ],
    },
  ],
});

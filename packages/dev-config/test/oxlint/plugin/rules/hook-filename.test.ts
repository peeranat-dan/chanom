import { RuleTester } from 'oxlint/plugins-dev';
import { describe, it } from 'vitest';

import hookFilename from '../../../../src/oxlint/plugin/rules/hook-filename.ts';

RuleTester.describe = describe;
RuleTester.it = it;

new RuleTester().run('hook-filename', hookFilename, {
  valid: [
    { code: 'export {};', filename: '/app/src/hooks/use-foo.ts' },
    { code: 'export {};', filename: '/app/src/hooks/useFoo.tsx' },
    { code: 'export {};', filename: '/app/src/hooks/index.ts' },
    { code: 'export {};', filename: '/app/src/utils/foo.ts' },
  ],
  invalid: [
    {
      code: 'export {};',
      filename: '/app/src/hooks/foo.ts',
      errors: [{ messageId: 'missingUsePrefix', data: { basename: 'foo' } }],
    },
    {
      code: 'export {};',
      filename: '/app/src/hooks/auth/user.ts',
      errors: [{ messageId: 'missingUsePrefix', data: { basename: 'user' } }],
    },
  ],
});

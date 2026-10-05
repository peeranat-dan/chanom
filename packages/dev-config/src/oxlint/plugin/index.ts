import { definePlugin } from '@oxlint/plugins';

import hookFilename from './rules/hook-filename.js';
import hookName from './rules/hook-name.js';

export default definePlugin({
  meta: { name: 'chanom' },
  rules: {
    'hook-filename': hookFilename,
    'hook-name': hookName,
  },
});

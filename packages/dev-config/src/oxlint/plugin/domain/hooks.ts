const HOOKS_DIR = 'hooks';

// `use` must be followed by a word boundary so `user.ts` or `username` do not count as hooks.
const HOOK_FILENAME_PATTERN = /^use[A-Z0-9_-]/;
const HOOK_NAME_PATTERN = /^use[A-Z0-9]/;

// Barrels and companion files live next to hooks without being hooks themselves.
const EXEMPT_BASENAMES: ReadonlySet<string> = new Set(['index']);

const toSegments = (filename: string): readonly string[] => filename.split(/[\\/]/);

export const isInHooksDir = (filename: string): boolean =>
  toSegments(filename).slice(0, -1).includes(HOOKS_DIR);

/** File name without directory and without any extensions (`use-foo.test.ts` → `use-foo`). */
export const getBasename = (filename: string): string => {
  const file = toSegments(filename).at(-1) ?? '';
  const dot = file.indexOf('.');
  return dot === -1 ? file : file.slice(0, dot);
};

export const isHookFilename = (filename: string): boolean => {
  const basename = getBasename(filename);
  return EXEMPT_BASENAMES.has(basename) || HOOK_FILENAME_PATTERN.test(basename);
};

export const isHookName = (name: string): boolean => HOOK_NAME_PATTERN.test(name);

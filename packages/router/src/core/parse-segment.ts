import type { Segment } from './types.ts';

const SPLAT = /^\[\.\.\.\w+\]$/;
const OPTIONAL = /^-\[(\w+)\]$/;
const PARAM = /^\[(\w+)\]$/;
const GROUP = /^\(.+\)$/;

/**
 * Converts one file or folder name into a route path segment:
 * `[id]` → `:id`, `-[lang]` → `:lang?`, `[...slug]` → `*`, `(group)` → no segment.
 */
export default function parseSegment(name: string): Segment {
  if (SPLAT.test(name)) return { kind: 'splat', path: '*' };
  if (GROUP.test(name)) return { kind: 'group' };

  const optional = OPTIONAL.exec(name);
  if (optional) return { kind: 'optional', path: `:${optional[1]}?` };

  const param = PARAM.exec(name);
  if (param) return { kind: 'param', path: `:${param[1]}` };

  return { kind: 'static', path: name };
}

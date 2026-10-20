export type Segment =
  | { readonly kind: 'static'; readonly path: string }
  | { readonly kind: 'param'; readonly path: string }
  | { readonly kind: 'optional'; readonly path: string }
  | { readonly kind: 'splat'; readonly path: '*' }
  | { readonly kind: 'group' };

const SPLAT = /^\[\.\.\.\w+\]$/;
const OPTIONAL = /^-\[(\w+)\]$/;
const PARAM = /^\[(\w+)\]$/;
const GROUP = /^\(.+\)$/;

/**
 * Converts one file or folder name into a React Router path segment:
 * `[id]` → `:id`, `-[lang]` → `:lang?`, `[...slug]` → `*`, `(group)` → no segment.
 */
export function parseSegment(name: string): Segment {
  if (SPLAT.test(name)) return { kind: 'splat', path: '*' };
  if (GROUP.test(name)) return { kind: 'group' };

  const optional = OPTIONAL.exec(name);
  if (optional) return { kind: 'optional', path: `:${optional[1]}?` };

  const param = PARAM.exec(name);
  if (param) return { kind: 'param', path: `:${param[1]}` };

  return { kind: 'static', path: name };
}

export function segmentPath(segment: Segment): string | undefined {
  return segment.kind === 'group' ? undefined : segment.path;
}

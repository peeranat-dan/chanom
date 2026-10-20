import type { Segment } from './types.ts';

/** The path a segment adds to its route, or undefined for a `(group)`. */
export default function segmentPath(segment: Segment): string | undefined {
  return segment.kind === 'group' ? undefined : segment.path;
}

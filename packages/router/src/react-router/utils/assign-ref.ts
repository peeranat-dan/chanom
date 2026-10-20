import type { Ref } from 'react';

/** Sets `ref` to `node` and returns the cleanup React 19 runs when the node detaches. */
export default function assignRef<T>(
  ref: Ref<T> | undefined,
  node: T | null,
): (() => void) | undefined {
  if (typeof ref === 'function') {
    const cleanup = ref(node);
    return typeof cleanup === 'function' ? cleanup : () => ref(null);
  }
  if (ref) {
    ref.current = node;
    return () => {
      ref.current = null;
    };
  }
  return undefined;
}

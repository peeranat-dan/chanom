import type { FocusEvent, MouseEvent, Ref, RefCallback, TouchEvent } from 'react';

import { useCallback, useEffect } from 'react';

import { preload } from '../core/preload-registry.ts';

/**
 * When to download a link's page code ahead of the click:
 * - `intent` (default): on hover, focus, or touch start
 * - `viewport`: once the link scrolls into view
 * - `render`: as soon as the link renders
 * - `none`: only on navigation
 */
export type PreloadBehavior = 'intent' | 'viewport' | 'render' | 'none';

interface PreloadHandlers {
  readonly ref?: Ref<HTMLAnchorElement>;
  readonly onMouseEnter?: (event: MouseEvent<HTMLAnchorElement>) => void;
  readonly onFocus?: (event: FocusEvent<HTMLAnchorElement>) => void;
  readonly onTouchStart?: (event: TouchEvent<HTMLAnchorElement>) => void;
}

interface PreloadProps {
  readonly ref: RefCallback<HTMLAnchorElement>;
  readonly onMouseEnter: (event: MouseEvent<HTMLAnchorElement>) => void;
  readonly onFocus: (event: FocusEvent<HTMLAnchorElement>) => void;
  readonly onTouchStart: (event: TouchEvent<HTMLAnchorElement>) => void;
}

/** Wraps a link's ref and intent handlers so they also preload `to`, keeping the caller's own handlers. */
export function usePreload(
  to: string,
  behavior: PreloadBehavior,
  handlers: PreloadHandlers,
): PreloadProps {
  const { ref, onMouseEnter, onFocus, onTouchStart } = handlers;
  const onIntent = behavior === 'intent' ? () => void preload(to) : undefined;

  useEffect(() => {
    if (behavior === 'render') void preload(to);
  }, [behavior, to]);

  const viewportRef = useCallback(
    (node: HTMLAnchorElement | null) => {
      const cleanup = assignRef(ref, node);
      if (behavior !== 'viewport' || !node || typeof IntersectionObserver === 'undefined') {
        return cleanup;
      }

      const observer = new IntersectionObserver((entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          observer.disconnect();
          void preload(to);
        }
      });
      observer.observe(node);
      return () => {
        observer.disconnect();
        cleanup?.();
      };
    },
    [behavior, ref, to],
  );

  return {
    ref: viewportRef,
    onMouseEnter: (event) => {
      onMouseEnter?.(event);
      onIntent?.();
    },
    onFocus: (event) => {
      onFocus?.(event);
      onIntent?.();
    },
    onTouchStart: (event) => {
      onTouchStart?.(event);
      onIntent?.();
    },
  };
}

function assignRef<T>(ref: Ref<T> | undefined, node: T | null): (() => void) | undefined {
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

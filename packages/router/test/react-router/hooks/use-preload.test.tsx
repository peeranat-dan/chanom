// @vitest-environment jsdom
import type { ReactElement } from 'react';

import { act } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { PreloadBehavior } from '../../../src/react-router/hooks/use-preload.ts';

import usePreload from '../../../src/react-router/hooks/use-preload.ts';
import { renderAt, settle } from '../../support/render.tsx';
import { trackPreloads } from '../../support/track-preloads.ts';

afterEach(() => {
  document.body.innerHTML = '';
});

function Anchor(props: {
  readonly behavior: PreloadBehavior;
  readonly onFocus?: () => void;
}): ReactElement {
  // An href makes the anchor focusable.
  return (
    <a href="/about" {...usePreload('/about', props.behavior, { onFocus: props.onFocus })}>
      About
    </a>
  );
}

async function dispatch(container: HTMLElement, event: Event | 'focus'): Promise<void> {
  const anchor = container.querySelector('a');
  await act(async () => {
    if (event === 'focus') anchor?.focus();
    else anchor?.dispatchEvent(event);
  });
}

describe('usePreload', () => {
  it('preloads on hover, focus, and touch start for intent', async () => {
    const preload = trackPreloads();
    const onFocus = vi.fn();
    const { container } = await renderAt(<Anchor behavior="intent" onFocus={onFocus} />);

    await dispatch(container, new MouseEvent('mouseover', { bubbles: true }));
    await dispatch(container, 'focus');
    await dispatch(container, new TouchEvent('touchstart', { bubbles: true }));

    expect(onFocus).toHaveBeenCalledOnce();
    expect(preload).toHaveBeenCalledTimes(3);
  });

  it('preloads on render', async () => {
    const preload = trackPreloads();

    await renderAt(<Anchor behavior="render" />);

    expect(preload).toHaveBeenCalledOnce();
  });

  it('preloads once the link enters the viewport', async () => {
    const preload = trackPreloads();
    let notify: (entries: { isIntersecting: boolean }[]) => void = () => {};
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        constructor(callback: typeof notify) {
          notify = callback;
        }
        observe(): void {}
        disconnect(): void {}
      },
    );
    await renderAt(<Anchor behavior="viewport" />);

    expect(preload).not.toHaveBeenCalled();
    notify([{ isIntersecting: true }]);
    await settle();
    expect(preload).toHaveBeenCalledOnce();
  });

  it('never preloads with none', async () => {
    const preload = trackPreloads();
    const { container } = await renderAt(<Anchor behavior="none" />);

    await dispatch(container, 'focus');

    expect(preload).not.toHaveBeenCalled();
  });
});

// @vitest-environment jsdom
import { act } from 'react';
import { afterEach, describe, expect, it } from 'vitest';

import { usePreload } from '../../src/hooks/use-preload.ts';
import { renderAt } from '../support/render.tsx';
import { trackPreloads } from '../support/track-preloads.ts';

afterEach(() => {
  document.body.innerHTML = '';
});

function Anchor(props: { readonly behavior: 'intent' | 'none' }): React.ReactElement {
  return <a {...usePreload('/about', props.behavior, {})}>About</a>;
}

describe('usePreload', () => {
  it('preloads on touch start for intent', async () => {
    const preload = trackPreloads();
    const { container } = await renderAt(<Anchor behavior="intent" />);

    await act(async () => {
      container.querySelector('a')?.dispatchEvent(new TouchEvent('touchstart', { bubbles: true }));
    });

    expect(preload).toHaveBeenCalledOnce();
  });

  it('skips IntersectionObserver when the browser lacks it', async () => {
    const preload = trackPreloads();
    const { container } = await renderAt(<Anchor behavior="none" />);

    expect(container.querySelector('a')).not.toBeNull();
    expect(preload).not.toHaveBeenCalled();
  });
});

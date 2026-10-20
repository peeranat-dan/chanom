import { act, createRef } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

// @vitest-environment jsdom
import type {} from '../../support/register.ts';

import Link from '../../../src/react-router/components/link.tsx';
import { renderAt } from '../../support/render.tsx';
import { trackPreloads } from '../../support/track-preloads.ts';

afterEach(() => {
  document.body.innerHTML = '';
});

describe('Link', () => {
  it('renders the href built from the path, params, search, and hash', async () => {
    const { container } = await renderAt(
      <Link to="/posts/:id" params={{ id: '1' }} search={{ tab: 'comments' }} hash="top">
        Post
      </Link>,
    );

    expect(container.querySelector('a')?.getAttribute('href')).toBe('/posts/1?tab=comments#top');
  });

  it('navigates on click', async () => {
    const { container, router } = await renderAt(<Link to="/about">About</Link>);

    await act(async () => container.querySelector('a')?.click());

    expect(router.state.location.pathname).toBe('/about');
  });

  it('preloads on intent by default and still calls the caller handlers', async () => {
    const preload = trackPreloads();
    const onMouseEnter = vi.fn();
    const { container } = await renderAt(
      <Link to="/about" onMouseEnter={onMouseEnter}>
        About
      </Link>,
    );

    await act(async () => {
      container.querySelector('a')?.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
    });

    expect(onMouseEnter).toHaveBeenCalledOnce();
    expect(preload).toHaveBeenCalledOnce();
  });

  it('passes the preload behavior through', async () => {
    const preload = trackPreloads();

    await renderAt(
      <Link to="/about" preload="render">
        About
      </Link>,
    );

    expect(preload).toHaveBeenCalledOnce();
  });

  it('forwards refs', async () => {
    const ref = createRef<HTMLAnchorElement>();

    await renderAt(
      <Link to="/about" ref={ref}>
        About
      </Link>,
    );

    expect(ref.current?.getAttribute('href')).toBe('/about');
  });

  it('type-checks paths and params', () => {
    // @ts-expect-error unknown path
    void (<Link to="/missing">x</Link>);
    // @ts-expect-error missing required params
    void (<Link to="/posts/:id">x</Link>);
    void (
      <Link
        to="/posts/:id"
        // @ts-expect-error wrong param name
        params={{ slug: '1' }}
      >
        x
      </Link>
    );
    void (<Link to="/:lang?/docs">x</Link>);
  });
});

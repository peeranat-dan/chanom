import { act, createRef } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

// @vitest-environment jsdom
import type {} from '../support/register.ts';

import { Link } from '../../src/components/link.tsx';
import { renderAt, settle } from '../support/render.tsx';
import { trackPreloads } from '../support/track-preloads.ts';

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

  it('preloads on intent and still calls the caller handlers', async () => {
    const preload = trackPreloads();
    const onMouseEnter = vi.fn();
    const onFocus = vi.fn();
    const { container } = await renderAt(
      <Link to="/about" onMouseEnter={onMouseEnter} onFocus={onFocus}>
        About
      </Link>,
    );
    const anchor = container.querySelector('a');

    await act(async () => {
      anchor?.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
      anchor?.focus();
    });

    expect(onMouseEnter).toHaveBeenCalledOnce();
    expect(onFocus).toHaveBeenCalledOnce();
    // One preload per intent; the shared import inside each page route dedupes the download.
    expect(preload).toHaveBeenCalledTimes(2);
  });

  it('preloads on render', async () => {
    const preload = trackPreloads();

    await renderAt(
      <Link to="/about" preload="render">
        About
      </Link>,
    );

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
    await renderAt(
      <Link to="/about" preload="viewport">
        About
      </Link>,
    );

    expect(preload).not.toHaveBeenCalled();
    notify([{ isIntersecting: true }]);
    await settle();
    expect(preload).toHaveBeenCalledOnce();
  });

  it('never preloads with preload="none"', async () => {
    const preload = trackPreloads();
    const { container } = await renderAt(
      <Link to="/about" preload="none">
        About
      </Link>,
    );

    await act(async () => container.querySelector('a')?.focus());

    expect(preload).not.toHaveBeenCalled();
  });

  it('forwards object and callback refs', async () => {
    const objectRef = createRef<HTMLAnchorElement>();
    const callbackRef = vi.fn();
    await renderAt(
      <>
        <Link to="/about" ref={objectRef}>
          About
        </Link>
        <Link to="/login" ref={callbackRef}>
          Login
        </Link>
      </>,
    );

    expect(objectRef.current?.getAttribute('href')).toBe('/about');
    expect(callbackRef).toHaveBeenCalledWith(expect.any(HTMLAnchorElement));
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

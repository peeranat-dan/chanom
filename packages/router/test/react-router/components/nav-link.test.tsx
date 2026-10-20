import { act } from 'react';
import { afterEach, describe, expect, it } from 'vitest';

// @vitest-environment jsdom
import type {} from '../../support/register.ts';

import NavLink from '../../../src/react-router/components/nav-link.tsx';
import { renderAt } from '../../support/render.tsx';
import { trackPreloads } from '../../support/track-preloads.ts';

afterEach(() => {
  document.body.innerHTML = '';
});

describe('NavLink', () => {
  it('builds the href and marks the active link', async () => {
    const { container } = await renderAt(
      <NavLink
        to="/posts/:id"
        params={{ id: '1' }}
        className={({ isActive }) => (isActive ? 'on' : 'off')}
      >
        Post
      </NavLink>,
      '/posts/1',
    );
    const anchor = container.querySelector('a');

    expect(anchor?.getAttribute('href')).toBe('/posts/1');
    expect(anchor?.className).toBe('on');
  });

  it('preloads on intent', async () => {
    const preload = trackPreloads();
    const { container } = await renderAt(<NavLink to="/about">About</NavLink>);

    await act(async () => container.querySelector('a')?.focus());

    expect(preload).toHaveBeenCalledOnce();
  });
});

import { describe, expect, it } from 'vitest';

import type {} from './support/register.ts';

import { redirect } from '../src/redirect.ts';

describe('redirect', () => {
  it('redirects to the built href with a 302 by default', () => {
    const response = redirect('/posts/:id', { params: { id: '1' }, search: { from: 'home' } });

    expect(response.status).toBe(302);
    expect(response.headers.get('Location')).toBe('/posts/1?from=home');
  });

  it('accepts a status or ResponseInit', () => {
    expect(redirect('/login', { init: 301 }).status).toBe(301);
    expect(
      redirect('/login', { init: { status: 307, headers: { 'X-A': '1' } } }).headers.get('X-A'),
    ).toBe('1');
  });

  it('needs no options for static paths', () => {
    expect(redirect('/about').headers.get('Location')).toBe('/about');
  });
});

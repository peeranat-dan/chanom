import { describe, expect, it, vi } from 'vitest';

import preload from '../../src/react-router/preload.ts';
import registerRoutes from '../../src/react-router/utils/register-routes.ts';

describe('preload', () => {
  it('loads every lazy route matching the path, ignoring search and hash', async () => {
    const root = vi.fn(async () => ({}));
    const post = vi.fn(async () => ({}));
    const other = vi.fn(async () => ({}));
    registerRoutes([
      {
        path: '/',
        lazy: root,
        children: [
          { path: 'posts/:id', lazy: post },
          { path: 'about', lazy: other },
        ],
      },
    ]);

    await preload('/posts/1?tab=comments#top');

    expect(root).toHaveBeenCalledOnce();
    expect(post).toHaveBeenCalledOnce();
    expect(other).not.toHaveBeenCalled();
  });

  it('swallows load failures', async () => {
    registerRoutes([{ path: '/', lazy: () => Promise.reject(new Error('offline')) }]);

    await expect(preload('/')).resolves.toBeUndefined();
  });

  it('does nothing when no route matches', async () => {
    registerRoutes([]);

    await expect(preload('/missing')).resolves.toBeUndefined();
  });
});

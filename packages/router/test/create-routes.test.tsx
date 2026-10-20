// @vitest-environment jsdom
import type { ReactElement } from 'react';

import { Outlet, useLoaderData } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { preload } from '../src/core/preload-registry.ts';
import { createRoutes } from '../src/create-routes.ts';
import { renderRoutes } from './support/render.tsx';

function text(label: string): () => ReactElement {
  return () => <p>{label}</p>;
}

function layout(label: string): () => ReactElement {
  return () => (
    <section>
      {label}:<Outlet />
    </section>
  );
}

const pages = {
  './pages/_app.tsx': async () => ({ default: layout('app') }),
  './pages/404.tsx': async () => ({ default: text('not found') }),
  './pages/index.tsx': async () => ({ default: text('home') }),
  './pages/posts/_layout.tsx': async () => ({ default: layout('posts') }),
  './pages/posts/[id].tsx': async () => ({
    loader: ({ params }: { params: { id?: string } }) => `post ${params.id}`,
    default: function Post(): ReactElement {
      return <p>{useLoaderData<string>()}</p>;
    },
  }),
  './pages/(auth)/login.tsx': async () => ({ default: text('login') }),
  './pages/-[lang]/docs.tsx': async () => ({ default: text('docs') }),
};

afterEach(() => {
  document.body.innerHTML = '';
});

describe('createRoutes', () => {
  it('renders the index page inside _app', async () => {
    const { container } = await renderRoutes(createRoutes(pages), '/');

    expect(container.innerHTML).toBe('<section>app:<p>home</p></section>');
  });

  it('nests pages in their folder layout and runs their loader', async () => {
    const { container } = await renderRoutes(createRoutes(pages), '/posts/7');

    expect(container.textContent).toBe('app:posts:post 7');
  });

  it('adds no path for (group) folders', async () => {
    const { container } = await renderRoutes(createRoutes(pages), '/login');

    expect(container.textContent).toBe('app:login');
  });

  it('matches optional -[param] segments with and without a value', async () => {
    const routes = createRoutes(pages);

    expect((await renderRoutes(routes, '/docs')).container.textContent).toBe('app:docs');
    expect((await renderRoutes(routes, '/en/docs')).container.textContent).toBe('app:docs');
  });

  it('renders 404 for unknown paths', async () => {
    const { container } = await renderRoutes(createRoutes(pages), '/nope/nothing');

    expect(container.textContent).toBe('app:not found');
  });

  it('renders 404 for a layout-less folder path without an index', async () => {
    const { container } = await renderRoutes(createRoutes(pages), '/en');

    expect(container.textContent).toBe('app:not found');
  });

  it('flattens layout-less folders into prefixed paths', () => {
    const routes = createRoutes({
      './pages/index.tsx': { default: text('home') },
      './pages/docs/index.tsx': { default: text('docs') },
      './pages/docs/(guides)/[slug].tsx': { default: text('guide') },
    });

    expect(routes[0]?.children?.map((route) => route.path ?? 'index')).toEqual([
      'index',
      'docs',
      'docs/:slug',
    ]);
  });

  it('prefers a root [...all] page over 404', async () => {
    const routes = createRoutes({
      ...pages,
      './pages/[...all].tsx': async () => ({ default: text('all') }),
    });
    const { container } = await renderRoutes(routes, '/nope');

    expect(container.textContent).toBe('app:all');
  });

  it('attaches eager modules without code splitting', async () => {
    const routes = createRoutes({ './pages/index.tsx': { default: text('eager') } });

    expect(routes[0]?.children?.[0]).toMatchObject({
      index: true,
      Component: expect.any(Function),
    });
    expect((await renderRoutes(routes, '/')).container.textContent).toBe('eager');
  });

  it('renders the fallback while the first routes load', async () => {
    const routes = createRoutes(
      { './pages/index.tsx': () => new Promise(() => {}) },
      { fallback: text('loading') },
    );

    expect((await renderRoutes(routes, '/')).container.textContent).toBe('loading');
  });

  it('imports each page once across preloading and navigation', async () => {
    const importer = vi.fn(async () => ({ default: text('home') }));
    const routes = createRoutes({ './pages/index.tsx': importer });

    await preload('/');
    const { container } = await renderRoutes(routes, '/');

    expect(container.textContent).toBe('home');
    expect(importer).toHaveBeenCalledOnce();
  });

  it('retries an import that failed', async () => {
    const importer = vi
      .fn<() => Promise<unknown>>()
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValue({ default: text('home') });
    createRoutes({ './pages/index.tsx': importer });

    await preload('/');
    await preload('/');

    expect(importer).toHaveBeenCalledTimes(2);
  });
});

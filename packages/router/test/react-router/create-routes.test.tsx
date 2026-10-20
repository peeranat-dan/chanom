// @vitest-environment jsdom
import type { ReactElement } from 'react';

import { Outlet, useLoaderData } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';

import createRoutes from '../../src/react-router/create-routes.ts';
import preload from '../../src/react-router/preload.ts';
import { renderRoutes } from '../support/render.tsx';

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

  it('renders 404 for unknown paths and bare layout-less folders', async () => {
    const routes = createRoutes(pages);

    expect((await renderRoutes(routes, '/nope/nothing')).container.textContent).toBe(
      'app:not found',
    );
    expect((await renderRoutes(routes, '/en')).container.textContent).toBe('app:not found');
  });

  it('prefers a root [...all] page over 404', async () => {
    const routes = createRoutes({
      ...pages,
      './pages/[...all].tsx': async () => ({ default: text('all') }),
    });
    const { container } = await renderRoutes(routes, '/nope');

    expect(container.textContent).toBe('app:all');
  });

  it('renders the fallback while the first routes load', async () => {
    const routes = createRoutes(
      { './pages/index.tsx': () => new Promise(() => {}) },
      { fallback: text('loading') },
    );

    expect((await renderRoutes(routes, '/')).container.textContent).toBe('loading');
  });

  it('registers the routes for preloading', async () => {
    const importer = vi.fn(async () => ({ default: text('home') }));
    createRoutes({ './pages/index.tsx': importer });

    await preload('/');

    expect(importer).toHaveBeenCalledOnce();
  });
});

# @chanom/router

Type-safe, file-based routing for [React Router](https://reactrouter.com/), inspired by [generouted](https://github.com/oedotme/generouted). Drop components into `src/pages`, get a code-split route tree, and navigate with links whose paths and params are checked by TypeScript.

## Why

- **Only React Router.** The runtime is a thin layer over `react-router` (data mode): no other runtime dependencies, and every React Router feature (loaders, actions, error boundaries, `useLoaderData`, `<Outlet />`, ...) works as usual.
- **Fast by default.** Every page is its own lazy chunk, matched routes load in parallel (no waterfalls), and `<Link>` preloads the target page's code on hover or focus, so most navigations start with the code already downloaded.
- **Type-safe without ceremony.** A Vite plugin writes a tiny `router.gen.ts` that lists your paths. `Link`, `NavLink`, `Navigate`, `useNavigate`, `useParams`, `redirect`, and `href` then reject unknown paths and missing or misspelled params.
- **Familiar conventions.** generouted-style file names, and React Router's own export names (`loader`, `action`, `ErrorBoundary`, ...).

## Setup

```sh
pnpm add @chanom/router react-router
```

Add the plugin, which generates and updates `src/router.gen.ts` (commit it, or add it to `.gitignore` and let the dev server and build create it):

```ts
// vite.config.ts
import { chanomRouter } from '@chanom/router/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), chanomRouter()],
});
```

Create the router from your pages:

```tsx
// src/main.tsx
import { createRouter } from '@chanom/router';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router';

const router = createRouter(import.meta.glob('./pages/**/*.tsx'));

createRoot(document.getElementById('root')!).render(<RouterProvider router={router} />);
```

## Pages

| File                           | Route                           |
| ------------------------------ | ------------------------------- |
| `pages/index.tsx`              | `/`                             |
| `pages/about.tsx`              | `/about`                        |
| `pages/posts/index.tsx`        | `/posts`                        |
| `pages/posts/[id].tsx`         | `/posts/:id`                    |
| `pages/-[lang]/docs.tsx`       | `/:lang?/docs` (optional param) |
| `pages/files/[...path].tsx`    | `/files/*` (splat)              |
| `pages/(auth)/login.tsx`       | `/login` (group, no segment)    |
| `pages/posts/_layout.tsx`      | Layout wrapping `posts/*`       |
| `pages/(auth)/_layout.tsx`     | Layout wrapping the group       |
| `pages/_app.tsx`               | Root layout wrapping every page |
| `pages/404.tsx`                | Fallback for unmatched paths    |
| `pages/_components/button.tsx` | Ignored (underscore prefix)     |

- Layouts render children with React Router's `<Outlet />`.
- `posts.tsx` next to a `posts/` folder without `index.tsx` is that folder's index.
- A root `[...all].tsx` takes precedence over `404.tsx`.

A page module may export any of these; all are optional:

```tsx
// src/pages/posts/[id].tsx
import type { LoaderFunctionArgs } from 'react-router';

import { useLoaderData } from 'react-router';

export async function loader({ params }: LoaderFunctionArgs) {
  return fetchPost(params.id!);
}

export function ErrorBoundary() {
  return <p>Could not load this post.</p>;
}

export const handle = { crumb: 'Post' };

export default function Post() {
  const post = useLoaderData<typeof loader>();
  return <h1>{post.title}</h1>;
}
```

Supported exports: `default` (the component), `loader`, `action`, `ErrorBoundary`, `handle`, and `shouldRevalidate`.

## Navigation

```tsx
import { href, Link, Navigate, NavLink, redirect, useNavigate, useParams } from '@chanom/router';

<Link to="/posts/:id" params={{ id: '1' }} search={{ tab: 'comments' }} hash="top">
  Post
</Link>;
<NavLink to="/about" className={({ isActive }) => (isActive ? 'active' : '')}>
  About
</NavLink>;
<Navigate to="/login" replace />;

const navigate = useNavigate();
navigate('/posts/:id', { params: { id: '1' }, replace: true });
navigate(-1);

const { id } = useParams('/posts/:id'); // { id: string }

href('/:lang?/docs', { params: { lang: 'th' } }); // '/th/docs'

// In a loader or action
throw redirect('/login', { search: { next: '/settings' }, init: 303 });
```

`params` is required exactly when the path has a required param, and TypeScript flags unknown paths, missing params, and misspelled param names. `search` takes a string, `URLSearchParams`, or a record (`null`/`undefined` values are skipped, arrays repeat the key).

Everything else (`Outlet`, `useLoaderData`, `useSearchParams`, `Form`, ...) comes straight from `react-router`.

## Performance

- **Code splitting.** With a lazy glob (the default `import.meta.glob(...)`), each page and layout is a separate chunk loaded through React Router's `lazy`. Pass `{ eager: true }` to bundle everything up front instead, or combine an eager glob for a few hot pages with a lazy one for the rest:

  ```ts
  const router = createRouter({
    ...import.meta.glob(['./pages/**/*.tsx', '!./pages/_app.tsx']),
    ...import.meta.glob('./pages/_app.tsx', { eager: true }),
  });
  ```

- **Preloading.** `Link` and `NavLink` take a `preload` prop:
  - `intent` (default): on hover, focus, or touch start
  - `viewport`: once the link scrolls into view (good for mobile)
  - `render`: as soon as the link renders
  - `none`: only when navigating

  Preloading only downloads code; loaders still run on navigation. Call `preload('/posts/1')` to warm a route from anywhere else. Each page is imported once, whether by preloading or navigation, and a failed download is retried on the next attempt.

- **Flat matching.** Folders without a `_layout` add no route of their own: `posts/[id].tsx` becomes a single `posts/:id` route.

## Options

```ts
createRouter(pages, {
  fallback: Spinner, // rendered while the first routes load; defaults to nothing
  root: './pages/', // prefix stripped from glob keys; defaults to their shared folder
  basename: '/app', // plus any other createBrowserRouter option
});
```

`createRoutes(pages, { fallback, root })` returns the plain `RouteObject[]` for `createHashRouter`, `createMemoryRouter`, or tests.

```ts
chanomRouter({
  pagesDir: 'src/pages', // default
  output: 'src/router.gen.ts', // default
  extensions: ['.tsx', '.jsx'], // default; keep in sync with your glob
});
```

## Without the plugin

The plugin only generates types. Without it every path is a plain `string`, or you can register paths yourself:

```ts
declare module '@chanom/router' {
  interface Register {
    paths: '/' | '/posts/:id';
  }
}
```

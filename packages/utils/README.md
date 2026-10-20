# @chanom/utils

Tree-shakable TypeScript utilities for frontend apps. Every util is a single default-exported function in its own folder, so bundlers only ship what you import, whether you import from the package root or from a util's subpath.

## Usage

```ts
import { cn, debounce, retry } from '@chanom/utils';
// or one util at a time
import debounce from '@chanom/utils/debounce';
```

## Utils

| Util                           | What it does                                                                                           |
| ------------------------------ | ------------------------------------------------------------------------------------------------------ |
| `cn(...classes)`               | Conditional class names with Tailwind conflict resolution, via [`cn`](https://github.com/shadcn-ui/cn) |
| `debounce(fn, wait)`           | Call after `wait` ms of silence; has `.cancel()` and `.flush()`                                        |
| `throttle(fn, wait)`           | At most one call per `wait` ms, with a trailing call using the latest args                             |
| `sleep(ms, signal?)`           | Promise-based delay, abortable with an `AbortSignal`                                                   |
| `retry(fn, options?)`          | Retry an async function with exponential backoff, `shouldRetry`, and abort                             |
| `isDefined(value)`             | Type guard for non-`null`/`undefined`; `items.filter(isDefined)` narrows to `T[]`                      |
| `chunk(items, size)`           | Split an array into chunks of `size`                                                                   |
| `groupBy(items, getKey)`       | Group an array into an object keyed by `getKey`                                                        |
| `pick(source, keys)`           | Copy only the given keys                                                                               |
| `omit(source, keys)`           | Copy everything except the given keys                                                                  |
| `clamp(value, min, max)`       | Limit a number to a range                                                                              |
| `formatBytes(bytes, options?)` | Human-readable sizes: `1536 -> '1.5 KB'`, or `'1.5 KiB'` with `binary: true`                           |
| `copyToClipboard(text)`        | Clipboard API with an `execCommand` fallback; resolves `false` on failure or SSR                       |

```ts
const save = debounce((value: string) => api.save(value), 300);

const user = await retry(() => fetchUser(id), {
  retries: 3,
  shouldRetry: (error) => !(error instanceof NotFoundError),
});

<button className={cn('px-2 py-1', isActive && 'bg-blue-500 px-4')} />;
```

The [`cn`](https://github.com/shadcn-ui/cn) dependency is only bundled when you import `cn`.

## Adding a util

```text
src/<util-name>/index.ts          # one default-exported function
src/<util-name>/utils/<helper>.ts # helpers, also default-exported
test/<util-name>/index.test.ts
test/<util-name>/utils/<helper>.test.ts
```

Then re-export it from `src/index.ts`. The `./*` subpath export and tsdown's `src/*/index.ts` entry pick it up automatically.

# @chanom/utils

Tree-shakable utilities, one default-exported function per util. Import from
the root or a subpath; both ship only what is used.

```ts
import { cn, debounce, retry } from '@chanom/utils';
import debounce from '@chanom/utils/debounce';
```

## Catalog

| Hand-rolled code you find                         | Replace with                                |
| ------------------------------------------------- | ------------------------------------------- |
| `clsx` + `tailwind-merge`, a local `cn`           | `cn(...classes)`                            |
| Local debounce / throttle, lodash ones            | `debounce(fn, ms)`, `throttle(fn, ms)`      |
| `new Promise((r) => setTimeout(r, ms))`           | `sleep(ms, signal?)`                        |
| Retry loops with backoff                          | `retry(fn, { retries, shouldRetry })`       |
| `Promise.race` with a timer                       | `withTimeout(task, ms, signal?)`            |
| Caching an in-flight request by key               | `dedupe(fn, getKey?)`                       |
| try/catch just to branch on success               | `tryCatch(task)` -> `{ ok, data \| error }` |
| `JSON.parse(localStorage.getItem(...))`           | `storage(key, { validate })`                |
| `navigator.clipboard.writeText` + fallback        | `copyToClipboard(text)`                     |
| `<a download>` blob dance                         | `downloadFile(data, filename)`              |
| Deep compare helpers                              | `isDeepEqual(a, b)`                         |
| `chunk`, `pick`, `omit`, `clamp`, byte formatting | same names, `formatBytes`                   |

## Wire

No setup module - import at the call site. After replacing a local helper,
delete it and any dependency (`clsx`, `tailwind-merge`, `lodash.debounce`) that
nothing else imports.

Grouping and null-filtering are left to the platform: `Object.groupBy` and
`items.filter((item) => item != null)`.

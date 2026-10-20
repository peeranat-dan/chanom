# @chanom/utils

Zero-dependency TypeScript utilities for frontend apps. Every util is a single default-exported function in its own folder, so you can import from the package root or straight from a util's subpath.

## Usage

```ts
import { createDeeplink, getQueryParams, openDeeplink, sumDecimals } from '@chanom/utils';
// or one util at a time
import sumDecimals from '@chanom/utils/sum-decimals';
```

### `sumDecimals(values, precision?)`

Sum numbers or numeric strings without floating point drift. With `precision`, the exact total is rounded half away from zero.

```ts
sumDecimals([0.1, 0.2]); // 0.3 (not 0.30000000000000004)
sumDecimals(['19.99', 0.01, '-5']); // 15
sumDecimals([1.005], 2); // 1.01
```

### `getQueryParams(url)`

Resolve a URL's query into a plain object. Accepts absolute URLs, relative paths, bare `?a=1` strings, hash-router URLs, or a `URL` instance. Repeated keys become arrays.

```ts
getQueryParams('https://example.com/p?tag=a&tag=b&page=2'); // { tag: ['a', 'b'], page: '2' }
getQueryParams('/#/page?tab=info'); // { tab: 'info' }
```

### `createDeeplink({ scheme, path?, params? })`

Build a custom-scheme link into a native app. Path segments are percent-encoded, `undefined` params are skipped, and arrays repeat the key.

```ts
createDeeplink({ scheme: 'myapp', path: 'product/42', params: { ref: 'web' } });
// 'myapp://product/42?ref=web'
```

### `openDeeplink(url, { fallbackUrl?, timeout? })`

Try to open the app. Resolves `true` when the page gets hidden (the app took over); otherwise navigates to `fallbackUrl` (e.g. the store page) after `timeout` ms (default `2000`) and resolves `false`. No-ops with `false` outside the browser.

```ts
const opened = await openDeeplink(createDeeplink({ scheme: 'myapp', path: 'home' }), {
  fallbackUrl: 'https://apps.apple.com/app/id000000000',
});
```

## Adding a util

```text
src/<util-name>/index.ts          # one default-exported function
src/<util-name>/utils/<helper>.ts # helpers, also default-exported
test/<util-name>/index.test.ts
test/<util-name>/utils/<helper>.test.ts
```

Then re-export it from `src/index.ts`. The `./*` subpath export and tsdown's `src/*/index.ts` entry pick it up automatically.

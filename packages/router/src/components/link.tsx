import type { ReactElement, RefAttributes } from 'react';
import type { LinkProps as RouterLinkProps } from 'react-router';

import { Link as RouterLink } from 'react-router';

import type { PreloadBehavior } from '../hooks/use-preload.ts';
import type { HrefOptions, Path } from '../types.ts';

import { usePreload } from '../hooks/use-preload.ts';
import { href } from '../href.ts';

export type LinkProps<P extends Path> = Omit<RouterLinkProps, 'to' | 'prefetch'> &
  RefAttributes<HTMLAnchorElement> &
  HrefOptions<NoInfer<P>> & {
    readonly to: P;
    /** When to download the target page's code. Defaults to `intent`. */
    readonly preload?: PreloadBehavior;
  };

/**
 * React Router's `<Link>` with a type-checked `to`, typed `params`, and page
 * code preloading on hover or focus.
 *
 * ```tsx
 * <Link to="/posts/:id" params={{ id: post.id }}>{post.title}</Link>
 * ```
 */
export function Link<P extends Path>(props: LinkProps<P>): ReactElement {
  const { to, params, search, hash, preload = 'intent', ...rest } = props;
  // HrefOptions<P> is conditional on P, so rebuild the options from their already-checked parts.
  const target = href<Path>(to, { params, search, hash } as HrefOptions<Path>);
  return <RouterLink {...rest} {...usePreload(target, preload, rest)} to={target} />;
}

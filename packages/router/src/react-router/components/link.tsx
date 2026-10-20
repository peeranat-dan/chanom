import type { ReactElement, RefAttributes } from 'react';
import type { LinkProps as RouterLinkProps } from 'react-router';

import { Link as RouterLink } from 'react-router';

import type { HrefOptions, Path } from '../../types.ts';
import type { PreloadBehavior } from '../hooks/use-preload.ts';

import usePreload from '../hooks/use-preload.ts';
import toHref from '../utils/to-href.ts';

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
export default function Link<P extends Path>(props: LinkProps<P>): ReactElement {
  const { to, params, search, hash, preload = 'intent', ...rest } = props;
  const target = toHref(to, { params, search, hash });
  return <RouterLink {...rest} {...usePreload(target, preload, rest)} to={target} />;
}

import type { ReactElement, RefAttributes } from 'react';
import type { NavLinkProps as RouterNavLinkProps } from 'react-router';

import { NavLink as RouterNavLink } from 'react-router';

import type { PreloadBehavior } from '../hooks/use-preload.ts';
import type { HrefOptions, Path } from '../types.ts';

import { usePreload } from '../hooks/use-preload.ts';
import { href } from '../href.ts';

export type NavLinkProps<P extends Path> = Omit<RouterNavLinkProps, 'to' | 'prefetch'> &
  RefAttributes<HTMLAnchorElement> &
  HrefOptions<NoInfer<P>> & {
    readonly to: P;
    /** When to download the target page's code. Defaults to `intent`. */
    readonly preload?: PreloadBehavior;
  };

/** React Router's `<NavLink>` with the same typing and preloading as {@link Link}. */
export function NavLink<P extends Path>(props: NavLinkProps<P>): ReactElement {
  const { to, params, search, hash, preload = 'intent', ...rest } = props;
  // HrefOptions<P> is conditional on P, so rebuild the options from their already-checked parts.
  const target = href<Path>(to, { params, search, hash } as HrefOptions<Path>);
  return <RouterNavLink {...rest} {...usePreload(target, preload, rest)} to={target} />;
}

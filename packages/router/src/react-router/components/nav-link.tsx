import type { ReactElement, RefAttributes } from 'react';
import type { NavLinkProps as RouterNavLinkProps } from 'react-router';

import { NavLink as RouterNavLink } from 'react-router';

import type { HrefOptions, Path } from '../../types.ts';
import type { PreloadBehavior } from '../hooks/use-preload.ts';

import usePreload from '../hooks/use-preload.ts';
import toHref from '../utils/to-href.ts';

export type NavLinkProps<P extends Path> = Omit<RouterNavLinkProps, 'to' | 'prefetch'> &
  RefAttributes<HTMLAnchorElement> &
  HrefOptions<NoInfer<P>> & {
    readonly to: P;
    /** When to download the target page's code. Defaults to `intent`. */
    readonly preload?: PreloadBehavior;
  };

/** React Router's `<NavLink>` with the same typing and preloading as `<Link>`. */
export default function NavLink<P extends Path>(props: NavLinkProps<P>): ReactElement {
  const { to, params, search, hash, preload = 'intent', ...rest } = props;
  const target = toHref(to, { params, search, hash });
  return <RouterNavLink {...rest} {...usePreload(target, preload, rest)} to={target} />;
}

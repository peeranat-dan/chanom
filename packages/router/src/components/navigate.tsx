import type { ReactElement } from 'react';
import type { NavigateProps as RouterNavigateProps } from 'react-router';

import { Navigate as RouterNavigate } from 'react-router';

import type { HrefOptions, Path } from '../types.ts';

import { href } from '../href.ts';

export type NavigateProps<P extends Path> = Omit<RouterNavigateProps, 'to'> &
  HrefOptions<NoInfer<P>> & { readonly to: P };

/** React Router's `<Navigate>` with a type-checked `to` and typed `params`. */
export function Navigate<P extends Path>(props: NavigateProps<P>): ReactElement {
  const { to, params, search, hash, ...rest } = props;
  // HrefOptions<P> is conditional on P, so rebuild the options from their already-checked parts.
  const target = href<Path>(to, { params, search, hash } as HrefOptions<Path>);
  return <RouterNavigate {...rest} to={target} />;
}

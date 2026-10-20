import type { ReactElement } from 'react';
import type { NavigateProps as RouterNavigateProps } from 'react-router';

import { Navigate as RouterNavigate } from 'react-router';

import type { HrefOptions, Path } from '../../types.ts';

import toHref from '../utils/to-href.ts';

export type NavigateProps<P extends Path> = Omit<RouterNavigateProps, 'to'> &
  HrefOptions<NoInfer<P>> & { readonly to: P };

/** React Router's `<Navigate>` with a type-checked `to` and typed `params`. */
export default function Navigate<P extends Path>(props: NavigateProps<P>): ReactElement {
  const { to, params, search, hash, ...rest } = props;
  return <RouterNavigate {...rest} to={toHref(to, { params, search, hash })} />;
}

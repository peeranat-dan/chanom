export type { LinkProps } from './components/link.tsx';
export type { NavigateProps } from './components/navigate.tsx';
export type { NavLinkProps } from './components/nav-link.tsx';
export type { CreateRouterOptions } from './create-router.ts';
export type { CreateRoutesOptions } from './create-routes.ts';
export type { PreloadBehavior } from './hooks/use-preload.ts';
export type { Navigate as NavigateFunction } from './hooks/use-navigate.ts';
export type {
  HrefArgs,
  HrefOptions,
  PageModules,
  Params,
  ParamsOption,
  Path,
  Register,
  RouteModule,
  SearchInit,
  SearchValue,
} from './types.ts';

export { Link } from './components/link.tsx';
export { Navigate } from './components/navigate.tsx';
export { NavLink } from './components/nav-link.tsx';
export { preload } from './core/preload-registry.ts';
export { createRouter } from './create-router.ts';
export { createRoutes } from './create-routes.ts';
export { href } from './href.ts';
export { useNavigate } from './hooks/use-navigate.ts';
export { useParams } from './hooks/use-params.ts';
export { redirect } from './redirect.ts';

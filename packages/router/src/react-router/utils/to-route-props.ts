import type { RouteModule, RouteProps } from '../types.ts';

/**
 * Maps a module's exports onto route properties. Missing exports are left out
 * rather than set to `undefined`, so they never shadow static route properties.
 */
export default function toRouteProps(module: RouteModule): RouteProps {
  const props: RouteProps = {};
  if (module.default !== undefined) props.Component = module.default;
  if (module.loader !== undefined) props.loader = module.loader;
  if (module.action !== undefined) props.action = module.action;
  if (module.ErrorBoundary !== undefined) props.ErrorBoundary = module.ErrorBoundary;
  if (module.handle !== undefined) props.handle = module.handle;
  if (module.shouldRevalidate !== undefined) props.shouldRevalidate = module.shouldRevalidate;
  return props;
}

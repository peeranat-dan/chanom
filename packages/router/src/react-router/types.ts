import type { ComponentType } from 'react';
import type {
  ActionFunction,
  LoaderFunction,
  RouteObject,
  ShouldRevalidateFunction,
} from 'react-router';

/** What a page, layout, `_app`, or `404` module may export. All exports are optional. */
export interface RouteModule {
  readonly default?: ComponentType;
  readonly loader?: LoaderFunction;
  readonly action?: ActionFunction;
  readonly ErrorBoundary?: ComponentType;
  readonly handle?: unknown;
  readonly shouldRevalidate?: ShouldRevalidateFunction;
}

/** Output of `import.meta.glob`: lazy importers, eager modules (`{ eager: true }`), or both. */
export type PageModules = Readonly<Record<string, unknown>>;

/** Route properties a page module provides. */
export type RouteProps = Pick<
  RouteObject,
  'Component' | 'loader' | 'action' | 'ErrorBoundary' | 'handle' | 'shouldRevalidate'
>;

/** A page's contribution to its route: eager {@link RouteProps} or a `lazy` loader for them. */
export type RouteSource = RouteProps & Pick<RouteObject, 'lazy'>;

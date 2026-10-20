import type { RouteObject } from 'react-router';

/** The route tree `preload` matches against, set by the latest `createRoutes` call. */
const registeredRoutes: { current: readonly RouteObject[] } = { current: [] };

export default registeredRoutes;

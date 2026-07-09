import type { AnalyticsProperties } from '../types.ts';

/**
 * Drop `undefined`-valued keys so vendors apply their own fallbacks
 * (current URL, document title, ...) instead of explicit `undefined` values.
 */
export function stripUndefined(properties: AnalyticsProperties): AnalyticsProperties {
  return Object.fromEntries(Object.entries(properties).filter(([, value]) => value !== undefined));
}

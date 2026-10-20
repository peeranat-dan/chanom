import waitForPageHide from './utils/wait-for-page-hide.ts';

export interface OpenDeeplinkOptions {
  /** Where to send the user when the app does not open, e.g. an app store page. */
  readonly fallbackUrl?: string;
  /** How long (ms) to wait for the app to take over before falling back. */
  readonly timeout?: number;
}

const DEFAULT_TIMEOUT = 2000;

/**
 * Try to open a native app via its deeplink. Resolves `true` when the page gets
 * hidden (the app opened), otherwise navigates to `fallbackUrl` when given and
 * resolves `false`. Always resolves `false` outside the browser (SSR).
 */
export default async function openDeeplink(
  url: string,
  { fallbackUrl, timeout = DEFAULT_TIMEOUT }: OpenDeeplinkOptions = {},
): Promise<boolean> {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return false;
  }

  // Listen before navigating so a fast app switch is not missed.
  const opened = waitForPageHide(timeout);
  window.location.href = url;
  if (await opened) {
    return true;
  }

  if (fallbackUrl !== undefined) {
    window.location.href = fallbackUrl;
  }
  return false;
}

import { vi } from 'vitest';

export interface FakeBrowser {
  readonly location: { href: string };
  /** Simulate the OS switching to another app. */
  readonly hidePage: () => void;
  /** Simulate the page being unloaded (e.g. bfcache). */
  readonly firePageHide: () => void;
}

/**
 * Stub `window`/`document` with just enough surface for the deeplink utils:
 * event targets for visibilitychange/pagehide plus a writable location.
 * Undone automatically after each test via `unstubGlobals` in vitest.config.ts.
 */
export const stubBrowser = (): FakeBrowser => {
  const location = { href: '' };
  const fakeWindow = Object.assign(new EventTarget(), { location });
  const fakeDocument = Object.assign(new EventTarget(), {
    visibilityState: 'visible' as DocumentVisibilityState,
  });
  vi.stubGlobal('window', fakeWindow);
  vi.stubGlobal('document', fakeDocument);
  return {
    location,
    hidePage: () => {
      fakeDocument.visibilityState = 'hidden';
      fakeDocument.dispatchEvent(new Event('visibilitychange'));
    },
    firePageHide: () => {
      fakeWindow.dispatchEvent(new Event('pagehide'));
    },
  };
};

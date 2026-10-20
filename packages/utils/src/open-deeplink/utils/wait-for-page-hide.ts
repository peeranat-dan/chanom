/**
 * Resolve `true` as soon as the page is hidden (the OS switched to another app),
 * or with the page's visibility once `timeout` ms pass. Listeners are always
 * removed once settled.
 */
export default function waitForPageHide(timeout: number): Promise<boolean> {
  return new Promise((resolve) => {
    const settle = (hidden: boolean): void => {
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('pagehide', onPageHide);
      resolve(hidden);
    };
    const onVisibilityChange = (): void => {
      if (document.visibilityState === 'hidden') {
        settle(true);
      }
    };
    const onPageHide = (): void => settle(true);

    const timer = setTimeout(() => settle(document.visibilityState === 'hidden'), timeout);
    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('pagehide', onPageHide);
  });
}

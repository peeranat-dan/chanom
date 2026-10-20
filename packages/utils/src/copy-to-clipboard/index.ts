import legacyCopy from './utils/legacy-copy.ts';

/**
 * Copy `text` to the clipboard. Prefers the async Clipboard API and falls back
 * to `execCommand` when it is missing or denied. Resolves `false` on failure or
 * outside the browser (SSR).
 */
export default async function copyToClipboard(text: string): Promise<boolean> {
  if (typeof document === 'undefined') {
    return false;
  }
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Missing API (http, old browsers) or a permission error both land here.
    return legacyCopy(text);
  }
}

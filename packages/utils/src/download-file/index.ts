export interface DownloadFileOptions {
  /** MIME type used when `data` is a string. Defaults to `'text/plain'`. */
  readonly type?: string;
}

// Revoking the object URL right after `click()` can cancel the download in some
// browsers, so it is held for a while (the same delay FileSaver.js uses).
const REVOKE_DELAY = 40_000;

/**
 * Save `data` as `filename` through a temporary object URL and `<a download>`.
 * Strings become a Blob of `options.type`. Returns `false` outside the browser
 * (SSR).
 */
export default function downloadFile(
  data: Blob | string,
  filename: string,
  { type = 'text/plain' }: DownloadFileOptions = {},
): boolean {
  if (typeof document === 'undefined') {
    return false;
  }
  const blob = typeof data === 'string' ? new Blob([data], { type }) : data;
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = 'none';
  // Firefox ignores clicks on anchors that are not in the document.
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, REVOKE_DELAY);
  return true;
}

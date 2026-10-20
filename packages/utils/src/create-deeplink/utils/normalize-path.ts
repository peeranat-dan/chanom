/**
 * Drop leading/trailing slashes and empty segments, and percent-encode each
 * segment so user-supplied ids cannot break out of the path.
 */
export default function normalizePath(path: string): string {
  return path
    .split('/')
    .filter((segment) => segment !== '')
    .map((segment) => encodeURIComponent(segment))
    .join('/');
}

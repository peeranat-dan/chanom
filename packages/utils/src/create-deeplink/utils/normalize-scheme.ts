// RFC 3986 scheme: a letter followed by letters, digits, `+`, `-`, or `.`.
const SCHEME_PATTERN = /^[a-z][a-z\d+.-]*$/;

/** Accept `myapp`, `myapp:`, or `myapp://` and return the bare, lower-cased scheme. */
export default function normalizeScheme(scheme: string): string {
  const normalized = scheme
    .trim()
    .replace(/:(\/\/)?$/, '')
    .toLowerCase();
  if (!SCHEME_PATTERN.test(normalized)) {
    throw new TypeError(`Invalid deeplink scheme: ${scheme}`);
  }
  return normalized;
}

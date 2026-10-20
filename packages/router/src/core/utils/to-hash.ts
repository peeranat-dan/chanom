/** Normalizes a hash to `#hash`, or `''` when it is empty. */
export default function toHash(hash: string | undefined): string {
  if (!hash) return '';
  return hash.startsWith('#') ? hash : `#${hash}`;
}

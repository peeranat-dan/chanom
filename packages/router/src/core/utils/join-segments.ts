/** Joins route segments into an absolute URL pattern, skipping empty ones. */
export default function joinSegments(segments: readonly string[]): string {
  return `/${segments.filter(Boolean).join('/')}`;
}

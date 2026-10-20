/** Joins two relative route paths, either of which may be empty. */
export default function joinPath(parent: string, child: string): string {
  return parent && child ? `${parent}/${child}` : parent || child;
}

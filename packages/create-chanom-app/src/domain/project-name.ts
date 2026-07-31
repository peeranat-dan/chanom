/**
 * Converts a project name to the lowercase kebab-case format expected for an
 * unscoped npm package name.
 */
export function toKebabCase(name: string): string {
  return name
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1-$2')
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[._\s-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

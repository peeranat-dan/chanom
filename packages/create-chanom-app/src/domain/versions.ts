/** Exact, catalog-sourced versions for every dependency the generator can emit. */
export type DepVersions = Readonly<Record<string, string>>;

/**
 * Pinned version for `name`, throwing when it is absent. Missing keys are a
 * build/catalog bug (the strict build-time reader should have already caught
 * them), never a reason to fall back to a range or `latest`.
 */
export function resolveVersion(versions: DepVersions, name: string): string {
  const version = versions[name];
  if (version === undefined) {
    throw new Error(`No pinned version for "${name}". The dependency version map is incomplete.`);
  }
  return version;
}

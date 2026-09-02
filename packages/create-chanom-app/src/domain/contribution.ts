/** A file a topping contributes verbatim to the generated app. */
export interface ConfigFile {
  /** Path relative to the project root, using posix separators. */
  readonly path: string;
  readonly contents: string;
}

/** A symlink a topping contributes, target relative to the link's own directory. */
export interface ConfigLink {
  /** Link path relative to the project root, using posix separators. */
  readonly path: string;
  readonly target: string;
}

/**
 * A structured fragment a topping (or the baseline) folds into the generated
 * app. The scaffolder folds `[baseline, ...selectedToppings]` with a single
 * reducer, then renders `package.json` and `vite.config.ts` from the result.
 */
export interface Contribution {
  /** Runtime `dependencies` package names (versions injected at generation). */
  readonly dependencies: readonly string[];
  /** `devDependencies` package names. */
  readonly devDependencies: readonly string[];
  /** `scripts` entries merged into `package.json`. */
  readonly scripts: Readonly<Record<string, string>>;
  /** Import lines added to `vite.config.ts`, e.g. `import react from '...';`. */
  readonly viteImports: readonly string[];
  /** Plugin expressions added to the Vite `plugins` array, e.g. `react()`. */
  readonly vitePlugins: readonly string[];
  /** Verbatim files the topping writes (its own config, hook scripts, ...). */
  readonly files: readonly ConfigFile[];
  /** Symlinks the topping creates, made after its files are written. */
  readonly links: readonly ConfigLink[];
}

export const emptyContribution: Contribution = {
  dependencies: [],
  devDependencies: [],
  scripts: {},
  viteImports: [],
  vitePlugins: [],
  files: [],
  links: [],
};

const dedupe = (values: readonly string[]): string[] => [...new Set(values)];

/**
 * Folds contributions in order into a single value. Package names, vite imports,
 * and plugins are concatenated then de-duplicated (first occurrence wins its
 * position); scripts merge with later contributions overriding earlier keys;
 * files and links de-duplicate by path (first writer wins).
 */
export function mergeContributions(contributions: readonly Contribution[]): Contribution {
  const filesByPath = new Map<string, ConfigFile>();
  for (const contribution of contributions) {
    for (const file of contribution.files) {
      if (!filesByPath.has(file.path)) filesByPath.set(file.path, file);
    }
  }

  const linksByPath = new Map<string, ConfigLink>();
  for (const contribution of contributions) {
    for (const link of contribution.links) {
      if (!linksByPath.has(link.path)) linksByPath.set(link.path, link);
    }
  }

  return {
    dependencies: dedupe(contributions.flatMap((c) => c.dependencies)),
    devDependencies: dedupe(contributions.flatMap((c) => c.devDependencies)),
    scripts: contributions.reduce<Record<string, string>>(
      (acc, c) => ({ ...acc, ...c.scripts }),
      {},
    ),
    viteImports: dedupe(contributions.flatMap((c) => c.viteImports)),
    vitePlugins: dedupe(contributions.flatMap((c) => c.vitePlugins)),
    files: [...filesByPath.values()],
    links: [...linksByPath.values()],
  };
}

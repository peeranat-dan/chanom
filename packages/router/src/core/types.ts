export type Segment =
  | { readonly kind: 'static'; readonly path: string }
  | { readonly kind: 'param'; readonly path: string }
  | { readonly kind: 'optional'; readonly path: string }
  | { readonly kind: 'splat'; readonly path: '*' }
  | { readonly kind: 'group' };

/** A folder under the pages root. `path` is undefined for the root and `(group)` folders. */
export interface PageDir {
  readonly path: string | undefined;
  readonly layout: string | undefined;
  readonly index: string | undefined;
  readonly pages: readonly PageFile[];
  readonly dirs: readonly PageDir[];
}

export interface PageFile {
  readonly path: string;
  readonly file: string;
}

export interface PageTree {
  readonly app: string | undefined;
  readonly notFound: string | undefined;
  readonly root: PageDir;
}

/** Mutable folder node used while scanning, frozen into a {@link PageDir} afterwards. */
export interface DraftDir {
  layout?: string;
  index?: string;
  readonly pages: Map<string, string>;
  readonly dirs: Map<string, DraftDir>;
}

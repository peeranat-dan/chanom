/** A template file: its path under `templates/` and its destination. */
export interface TemplateFile {
  /** Path under the shipped `templates/` directory. */
  readonly src: string;
  /** Destination path relative to the generated project root. */
  readonly dest: string;
}

/**
 * Template files copied into every generated app. Source files use
 * a `.template` suffix so repository tooling does not lint, format, or type-check
 * them. `_gitignore` also uses a placeholder name because npm strips a real
 * `.gitignore` from published packages. Files whose content is computed
 * (package.json, vite.config.ts, tsconfig.json, index.html) are generated, not
 * listed here. Every file listed here is rendered through {@link renderTemplate}
 * on copy, so a `{{appName}}` token (currently in README.md, app.tsx, and
 * app.test.tsx) is substituted; a file with no token is copied unchanged.
 */
export const TEMPLATE_FILES: readonly TemplateFile[] = [
  { src: '_gitignore.template', dest: '.gitignore' },
  { src: 'README.md.template', dest: 'README.md' },
  { src: 'oxlint.config.ts.template', dest: 'oxlint.config.ts' },
  { src: 'oxfmt.config.ts.template', dest: 'oxfmt.config.ts' },
  { src: 'vitest.config.ts.template', dest: 'vitest.config.ts' },
  { src: 'src/main.tsx.template', dest: 'src/main.tsx' },
  { src: 'src/app.tsx.template', dest: 'src/app.tsx' },
  { src: 'src/app.test.tsx.template', dest: 'src/app.test.tsx' },
  { src: 'src/index.css.template', dest: 'src/index.css' },
  { src: 'src/test-setup.ts.template', dest: 'src/test-setup.ts' },
  { src: 'src/vite-env.d.ts.template', dest: 'src/vite-env.d.ts' },
];

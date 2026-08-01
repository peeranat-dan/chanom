/** A map of `{{token}}` names to the values substituted for them. */
export type TemplateVars = Readonly<Record<string, string>>;

/**
 * Replaces every `{{token}}` in `content` with its value from `vars` in a
 * single pass. The `{{…}}` delimiters make each substitution site explicit, so
 * an incidental occurrence of a value elsewhere in the file (a URL, a dependency
 * name) is never clobbered the way a blind `replaceAll` on a bare sentinel
 * would be. A token with no matching key is left untouched rather than replaced
 * with `undefined`, so an unrelated `{{…}}` in a template survives verbatim.
 */
export function renderTemplate(content: string, vars: TemplateVars): string {
  return content.replaceAll(/\{\{(\w+)\}\}/g, (match, token: string) =>
    Object.hasOwn(vars, token) ? vars[token] : match,
  );
}

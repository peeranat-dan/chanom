export function getMissingScripts(
  scripts: Record<string, string>,
): Partial<Record<'lint' | 'lint:fix', string>> {
  const missing: Partial<Record<'lint' | 'lint:fix', string>> = {};
  if (!scripts['lint']) missing['lint'] = 'oxlint';
  if (!scripts['lint:fix']) missing['lint:fix'] = 'oxlint --fix';
  return missing;
}

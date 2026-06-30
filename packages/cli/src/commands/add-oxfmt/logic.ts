export function getMissingScripts(
  scripts: Record<string, string>,
): Partial<Record<'format' | 'format:check', string>> {
  const missing: Partial<Record<'format' | 'format:check', string>> = {};
  if (!scripts['format']) missing['format'] = 'oxfmt';
  if (!scripts['format:check']) missing['format:check'] = 'oxfmt --check';
  return missing;
}

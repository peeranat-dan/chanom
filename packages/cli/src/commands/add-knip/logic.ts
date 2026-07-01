export function getMissingScripts(
  scripts: Record<string, string>,
): Partial<Record<'knip', string>> {
  const missing: Partial<Record<'knip', string>> = {};
  if (!scripts['knip']) missing['knip'] = 'knip';
  return missing;
}

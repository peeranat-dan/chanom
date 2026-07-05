export interface ScriptPlan {
  readonly scripts: Readonly<Record<string, string>>;
  readonly added: readonly string[];
  readonly skipped: readonly string[];
}

/**
 * Merges `wanted` scripts into `current` without overwriting anything the user
 * already has. Returns the merged scripts plus which keys were added or skipped.
 */
export function planScripts(
  current: Readonly<Record<string, string>> | undefined,
  wanted: Readonly<Record<string, string>>,
): ScriptPlan {
  const scripts: Record<string, string> = { ...current };
  const added: string[] = [];
  const skipped: string[] = [];

  for (const [key, value] of Object.entries(wanted)) {
    if (scripts[key]) {
      skipped.push(key);
    } else {
      scripts[key] = value;
      added.push(key);
    }
  }

  return { scripts, added, skipped };
}

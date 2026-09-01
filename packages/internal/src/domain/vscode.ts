/** Keys VS Code reads as a per-language override, e.g. `[typescript]`. */
const LANGUAGES = ['markdown', 'json', 'typescriptreact', 'typescript', 'javascript'] as const;

const OXC_FORMATTER = 'oxc.oxc-vscode';

/** The extensions a chanom project recommends; unioned into an existing list. */
export const RECOMMENDED_EXTENSIONS: readonly string[] = [OXC_FORMATTER];

/**
 * The VS Code settings chanom contributes. Every value is portable across
 * projects - repo-specific entries (`cSpell.words`, `git.*`) are deliberately
 * excluded so this can be dropped into any project without carrying chanom's
 * own choices.
 *
 * `editor.formatOnSave` is false on purpose: formatting runs through the oxc
 * code action instead, so formatting and lint fixes apply in one pass rather
 * than racing each other.
 */
export function chanomSettings(oxfmtConfigPath: string): Readonly<Record<string, unknown>> {
  return {
    'editor.defaultFormatter': OXC_FORMATTER,
    'editor.formatOnSave': false,
    'editor.codeActionsOnSave': {
      'source.format.oxc': 'always',
      'source.fixAll.oxc': 'always',
      'source.removeUnusedImports': 'always',
    },
    'oxc.fmt.configPath': oxfmtConfigPath,
    'oxc.typeAware': true,
    ...Object.fromEntries(
      LANGUAGES.map((language) => [`[${language}]`, { 'editor.defaultFormatter': OXC_FORMATTER }]),
    ),
  };
}

export interface SettingsPlan {
  readonly settings: Readonly<Record<string, unknown>>;
  readonly added: readonly string[];
  readonly skipped: readonly string[];
}

/**
 * Merges `wanted` settings into `current` without overwriting anything already
 * set, mirroring `planScripts`. The merge is one level deep by key: a key the
 * user already has is left untouched even when its value is an object, because
 * a partially merged `editor.codeActionsOnSave` is more surprising than one the
 * user fully owns.
 */
export function planSettings(
  current: Readonly<Record<string, unknown>> | undefined,
  wanted: Readonly<Record<string, unknown>>,
): SettingsPlan {
  const settings: Record<string, unknown> = { ...current };
  const added: string[] = [];
  const skipped: string[] = [];

  for (const [key, value] of Object.entries(wanted)) {
    if (Object.hasOwn(settings, key)) {
      skipped.push(key);
    } else {
      settings[key] = value;
      added.push(key);
    }
  }

  return { settings, added, skipped };
}

export interface ExtensionsPlan {
  readonly recommendations: readonly string[];
  readonly added: readonly string[];
}

/** Unions `wanted` into the existing recommendations, preserving existing order. */
export function planExtensions(
  current: readonly string[] | undefined,
  wanted: readonly string[],
): ExtensionsPlan {
  const recommendations = [...(current ?? [])];
  const added: string[] = [];

  for (const extension of wanted) {
    if (!recommendations.includes(extension)) {
      recommendations.push(extension);
      added.push(extension);
    }
  }

  return { recommendations, added };
}

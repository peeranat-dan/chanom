import type { ExtensionsPlan, SettingsPlan } from '@chanom/internal';

import { Prompter } from '@chanom/internal';
import { Effect, FileSystem, Option, Path, Schema } from 'effect';

import { chanomSettings, planExtensions, planSettings, RECOMMENDED_EXTENSIONS } from './logic.ts';

export { chanomSettings, planExtensions, planSettings, RECOMMENDED_EXTENSIONS } from './logic.ts';

const SettingsJson = Schema.Record(Schema.String, Schema.Unknown);

const ExtensionsJson = Schema.StructWithRest(
  Schema.Struct({ recommendations: Schema.optionalKey(Schema.Array(Schema.String)) }),
  [Schema.Record(Schema.String, Schema.Unknown)],
);

const writeJson = Effect.fn('add-vscode.writeJson')(function* (filePath: string, value: unknown) {
  const fs = yield* FileSystem.FileSystem;
  yield* fs.writeFileString(filePath, JSON.stringify(value, null, 2) + '\n');
});

/**
 * Reads and parses an existing `.vscode` file. `.vscode` files are JSONC by
 * convention, so a file we cannot parse is not an error - it is a file the user
 * hand-wrote with comments. Returns `None` for both "absent" and "unparseable";
 * the caller distinguishes them via `fs.exists` to warn appropriately.
 */
const readJson = Effect.fn('add-vscode.readJson')(function* <A>(
  filePath: string,
  schema: Schema.Codec<A, unknown>,
) {
  const fs = yield* FileSystem.FileSystem;
  if (!(yield* fs.exists(filePath))) return Option.none<A>();

  const contents = yield* fs.readFileString(filePath);
  return Schema.decodeUnknownOption(Schema.fromJsonString(schema))(contents);
});

const applySettings = Effect.fn('add-vscode.applySettings')(function* (
  vscodeDir: string,
  oxfmtConfigPath: string,
) {
  const fs = yield* FileSystem.FileSystem;
  const path = yield* Path.Path;
  const prompter = yield* Prompter;

  const filePath = path.join(vscodeDir, 'settings.json');
  const existed = yield* fs.exists(filePath);
  const existing = yield* readJson(filePath, SettingsJson);

  if (existed && Option.isNone(existing)) {
    yield* prompter.warn(
      '`.vscode/settings.json` could not be parsed (comments?) - skipping settings',
    );
    return;
  }

  const plan: SettingsPlan = planSettings(
    Option.getOrUndefined(existing),
    chanomSettings(oxfmtConfigPath),
  );

  for (const key of plan.skipped) {
    yield* prompter.warn(`\`${key}\` is already set in .vscode/settings.json - skipping`);
  }

  if (plan.added.length > 0) {
    yield* writeJson(filePath, plan.settings);
  }
});

const applyExtensions = Effect.fn('add-vscode.applyExtensions')(function* (vscodeDir: string) {
  const fs = yield* FileSystem.FileSystem;
  const path = yield* Path.Path;
  const prompter = yield* Prompter;

  const filePath = path.join(vscodeDir, 'extensions.json');
  const existed = yield* fs.exists(filePath);
  const existing = yield* readJson(filePath, ExtensionsJson);

  if (existed && Option.isNone(existing)) {
    yield* prompter.warn(
      '`.vscode/extensions.json` could not be parsed (comments?) - skipping recommendations',
    );
    return;
  }

  const plan: ExtensionsPlan = planExtensions(
    Option.getOrUndefined(existing)?.recommendations,
    RECOMMENDED_EXTENSIONS,
  );

  if (plan.added.length > 0) {
    yield* writeJson(filePath, {
      ...Option.getOrUndefined(existing),
      recommendations: plan.recommendations,
    });
  }
});

/**
 * Writes `.vscode/settings.json` and `.vscode/extensions.json`, merging into
 * whatever is already there. Existing settings keys and recommendations always
 * win, so re-running is safe and never clobbers the user's editor config.
 *
 * Unlike the other add-* commands this contributes no packages and no scripts,
 * so it returns nothing - there is no `Pkg` for the caller to persist.
 */
export const apply = Effect.fn('add-vscode.apply')(function* (
  cwd: string,
  oxfmtConfigPath: string,
) {
  const fs = yield* FileSystem.FileSystem;
  const path = yield* Path.Path;

  const vscodeDir = path.join(cwd, '.vscode');
  yield* fs.makeDirectory(vscodeDir, { recursive: true });

  yield* applySettings(vscodeDir, oxfmtConfigPath);
  yield* applyExtensions(vscodeDir);
});

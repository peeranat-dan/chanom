/**
 * The pure `.vscode` decisions live in `@chanom/internal` so `chanom brew` and
 * `create-chanom-app` emit byte-identical editor config. This module re-exports
 * them to keep the command's `logic.ts` boundary intact.
 */
export {
  chanomSettings,
  type ExtensionsPlan,
  planExtensions,
  planSettings,
  RECOMMENDED_EXTENSIONS,
  type SettingsPlan,
} from '@chanom/internal';

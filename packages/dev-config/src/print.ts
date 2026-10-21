const configLoaders = {
  'oxlint/base': () => import('./oxlint/base-config.js'),
  'oxlint/config': () => import('./oxlint/index.js'),
  'oxfmt/base': () => import('./oxfmt/base-config.js'),
  'oxfmt/config': () => import('./oxfmt/index.js'),
  'knip/base': () => import('./knip/base-config.js'),
  'knip/config': () => import('./knip/index.js'),
} as const;

export type ConfigName = keyof typeof configLoaders;

export const configNames = Object.keys(configLoaders) as readonly ConfigName[];

export type Command =
  | { readonly kind: 'print'; readonly name: ConfigName }
  | { readonly kind: 'list' }
  | { readonly kind: 'usage'; readonly error?: string };

const isConfigName = (value: string): value is ConfigName => Object.hasOwn(configLoaders, value);

export function parseArgs(args: readonly string[]): Command {
  const [command, name] = args;
  if (command === 'list') return { kind: 'list' };
  if (command !== 'print') {
    return command === undefined || command === '--help' || command === '-h'
      ? { kind: 'usage' }
      : { kind: 'usage', error: `Unknown command: ${command}` };
  }
  if (name === undefined) return { kind: 'usage', error: 'Missing config name.' };
  if (!isConfigName(name)) return { kind: 'usage', error: `Unknown config: ${name}` };
  return { kind: 'print', name };
}

export function usage(): string {
  return [
    'Usage: chanom-dev-config <command>',
    '',
    'Commands:',
    '  print <name>  Print the config shipped under @chanom/dev-config/<name> as JSON',
    '  list          List the available config names',
    '',
    'Configs:',
    ...configNames.map((name) => `  ${name}`),
  ].join('\n');
}

export async function loadConfig(name: ConfigName): Promise<unknown> {
  const module = await configLoaders[name]();
  return module.default;
}

export function formatConfig(config: unknown): string {
  return JSON.stringify(config, undefined, 2);
}

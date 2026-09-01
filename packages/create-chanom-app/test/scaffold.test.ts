import { describe, expect, it } from '@effect/vitest';
import { Effect } from 'effect';

import type { ScaffoldPlan } from '../src/scaffold.ts';

import { scaffold } from '../src/scaffold.ts';
import { makeEnv, TEMPLATE_ROOT } from './support/env.ts';

const basePlan: ScaffoldPlan = {
  targetDir: '/out',
  appName: 'out',
  pm: 'pnpm',
  git: false,
  commitHooks: false,
  install: false,
  templatesRoot: TEMPLATE_ROOT,
};

describe('scaffold', () => {
  it.effect('writes the generated files and copies templates verbatim', () => {
    const { fs, layer } = makeEnv();
    return Effect.gen(function* () {
      yield* scaffold(basePlan);
      expect(fs.files.has('/out/package.json')).toBe(true);
      expect(fs.files.has('/out/pnpm-workspace.yaml')).toBe(true);
      expect(fs.files.has('/out/vite.config.ts')).toBe(true);
      expect(fs.files.has('/out/tsconfig.json')).toBe(true);
      expect(fs.files.get('/out/index.html')).toContain('<title>out</title>');
      expect(fs.files.get('/out/src/main.tsx')).toBe('TEMPLATE:src/main.tsx.template\n');
      expect(fs.files.get('/out/.gitignore')).toBe('TEMPLATE:_gitignore.template\n');
      expect(fs.files.get('/out/.vscode/settings.json')).toContain('oxc.oxc-vscode');
      expect(fs.files.get('/out/.vscode/extensions.json')).toContain('oxc.oxc-vscode');
    }).pipe(Effect.provide(layer));
  });

  it.effect('uses the normalized project name in generated project files', () => {
    const { fs, layer } = makeEnv({
      files: {
        [`${TEMPLATE_ROOT}/README.md.template`]: '# my-app\n\nWelcome.\n',
        [`${TEMPLATE_ROOT}/src/app.tsx.template`]: '<h1>my-app</h1>\n',
        [`${TEMPLATE_ROOT}/src/app.test.tsx.template`]: "name: 'my-app'\n",
      },
    });
    return Effect.gen(function* () {
      yield* scaffold({ ...basePlan, appName: 'My Awesome App' });

      const pkg = JSON.parse(fs.files.get('/out/package.json') ?? '{}') as { name?: string };
      expect(pkg.name).toBe('my-awesome-app');
      expect(fs.files.get('/out/README.md')).toContain('# my-awesome-app');
      expect(fs.files.get('/out/index.html')).toContain('<title>my-awesome-app</title>');
      expect(fs.files.get('/out/src/app.tsx')).toContain('<h1>my-awesome-app</h1>');
      expect(fs.files.get('/out/src/app.test.tsx')).toContain("name: 'my-awesome-app'");
    }).pipe(Effect.provide(layer));
  });

  it.effect('omits commit-hooks files unless the topping is selected', () => {
    const { fs, layer } = makeEnv();
    return Effect.gen(function* () {
      yield* scaffold(basePlan);
      expect(fs.files.has('/out/.husky/commit-msg')).toBe(false);
      expect(fs.files.has('/out/.lintstagedrc.json')).toBe(false);
    }).pipe(Effect.provide(layer));
  });

  it.effect('writes the hook files when commit hooks are selected', () => {
    const { fs, layer } = makeEnv();
    return Effect.gen(function* () {
      yield* scaffold({ ...basePlan, commitHooks: true });
      expect(fs.files.get('/out/.husky/pre-commit')).toBe('lint-staged\n');
      expect(fs.files.get('/out/.husky/commit-msg')).toBe('pnpm exec commitlint --edit $1\n');
      expect(fs.files.has('/out/.lintstagedrc.json')).toBe(true);
      expect(fs.files.has('/out/.commitlintrc.json')).toBe(true);
    }).pipe(Effect.provide(layer));
  });

  it.effect('pins every generated dependency (no latest or range)', () => {
    const { fs, layer } = makeEnv();
    return Effect.gen(function* () {
      yield* scaffold({ ...basePlan, commitHooks: true });
      const pkg = JSON.parse(fs.files.get('/out/package.json') ?? '{}') as {
        dependencies: Record<string, string>;
        devDependencies: Record<string, string>;
      };
      for (const version of Object.values({ ...pkg.dependencies, ...pkg.devDependencies })) {
        expect(version).not.toMatch(/[\^~<>|]|latest/);
      }
    }).pipe(Effect.provide(layer));
  });

  it.effect('runs git init and an initial commit when git is on', () => {
    const { runner, layer } = makeEnv();
    return Effect.gen(function* () {
      yield* scaffold({ ...basePlan, git: true });
      const gitSubcommands = runner.calls.filter((c) => c.cmd === 'git').map((c) => c.args[0]);
      expect(gitSubcommands).toContain('init');
      expect(gitSubcommands).toContain('add');
      expect(gitSubcommands).toContain('commit');
    }).pipe(Effect.provide(layer));
  });

  it.effect('sets a local identity when git has none', () => {
    const { runner, layer } = makeEnv({
      commands: ({ args }) =>
        args[0] === 'var'
          ? { exitCode: 1, stdout: '', stderr: '' }
          : { exitCode: 0, stdout: '', stderr: '' },
    });
    return Effect.gen(function* () {
      yield* scaffold({ ...basePlan, git: true });
      const configCalls = runner.calls.filter((c) => c.cmd === 'git' && c.args[0] === 'config');
      expect(configCalls).toHaveLength(2);
    }).pipe(Effect.provide(layer));
  });

  it.effect('reports a failed initial commit without failing the scaffold', () => {
    const { prompter, layer } = makeEnv({
      commands: ({ cmd, args }) =>
        cmd === 'git' && args[0] === 'commit'
          ? { exitCode: 1, stdout: '', stderr: 'no identity' }
          : { exitCode: 0, stdout: '', stderr: '' },
    });
    return Effect.gen(function* () {
      yield* scaffold({ ...basePlan, git: true });
      expect(prompter.log.spinners.some((s) => s.stop?.includes('Could not create'))).toBe(true);
    }).pipe(Effect.provide(layer));
  });

  it.effect('installs dependencies when install is on', () => {
    const { runner, layer } = makeEnv();
    return Effect.gen(function* () {
      yield* scaffold({ ...basePlan, install: true });
      expect(runner.calls).toContainEqual({ cmd: 'pnpm', args: ['install'], cwd: '/out' });
    }).pipe(Effect.provide(layer));
  });

  it.effect('fails with InstallFailed on a non-zero install', () => {
    const { layer } = makeEnv({
      commands: ({ cmd }) =>
        cmd === 'pnpm'
          ? { exitCode: 1, stdout: '', stderr: '' }
          : { exitCode: 0, stdout: '', stderr: '' },
    });
    return Effect.gen(function* () {
      const error = yield* Effect.flip(scaffold({ ...basePlan, install: true }));
      expect(error._tag).toBe('InstallFailed');
    }).pipe(Effect.provide(layer));
  });
});

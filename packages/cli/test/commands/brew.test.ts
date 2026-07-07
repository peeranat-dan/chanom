import { describe, expect, it } from '@effect/vitest';
import { Effect } from 'effect';

import { brew } from '../../src/commands/brew/index.ts';
import {
  appendGitignoreEntry,
  hasGitignoreEntry,
  planPackages,
  selectedFormatters,
  selectedLinters,
} from '../../src/commands/brew/logic.ts';
import { makeTestEnv } from '../support/env.ts';

const versions = {
  oxlint: '1.0.0-test.oxlint',
  oxfmt: '1.0.0-test.oxfmt',
  knip: '1.0.0-test.knip',
  devConfig: '1.0.0-test.dev-config',
};

describe('logic', () => {
  it('plans packages for toppings and deduplicates shared dependencies', () => {
    expect(planPackages({}, ['oxlint', 'oxfmt'], 'light', versions)).toEqual([
      'oxlint@1.0.0-test.oxlint',
      '@chanom/dev-config@1.0.0-test.dev-config',
      'oxfmt@1.0.0-test.oxfmt',
    ]);
  });

  it('adds the commit-gate packages for medium sweetness', () => {
    expect(planPackages({}, [], 'medium', versions)).toEqual([
      'husky',
      'lint-staged',
      '@commitlint/cli',
      '@commitlint/config-conventional',
    ]);
  });

  it('plans nothing when everything is installed at the right version', () => {
    const pkg = {
      devDependencies: {
        oxlint: '1.0.0-test.oxlint',
        '@chanom/dev-config': '1.0.0-test.dev-config',
      },
    };
    expect(planPackages(pkg, ['oxlint'], 'light', versions)).toEqual([]);
  });

  it('detects a node_modules entry only on its own line', () => {
    expect(hasGitignoreEntry('node_modules\n', 'node_modules')).toBe(true);
    expect(hasGitignoreEntry('dist\nnode_modules/\n', 'node_modules')).toBe(true);
    expect(hasGitignoreEntry('/node_modules\n', 'node_modules')).toBe(true);
    expect(hasGitignoreEntry('packages/*/node_modules\n', 'node_modules')).toBe(false);
    expect(hasGitignoreEntry('# node_modules\n', 'node_modules')).toBe(false);
    expect(hasGitignoreEntry('', 'node_modules')).toBe(false);
  });

  it('appends an entry preserving existing lines and newline termination', () => {
    expect(appendGitignoreEntry('', 'node_modules')).toBe('node_modules\n');
    expect(appendGitignoreEntry('dist\n', 'node_modules')).toBe('dist\nnode_modules\n');
    expect(appendGitignoreEntry('dist', 'node_modules')).toBe('dist\nnode_modules\n');
  });

  it('splits toppings into linters and formatters', () => {
    expect(selectedLinters(['oxlint', 'oxfmt', 'knip'])).toEqual(['oxlint']);
    expect(selectedFormatters(['oxlint', 'oxfmt', 'knip'])).toEqual(['oxfmt']);
    expect(selectedLinters(['knip'])).toEqual([]);
  });
});

describe('brew', () => {
  const answers = {
    'Which toppings would you like?': ['oxlint', 'oxfmt'],
    'How sweet would you like it?': 'medium',
  };

  it.effect('brews a full medium setup end to end', () => {
    const env = makeTestEnv({
      files: {
        '/project/package.json': JSON.stringify({
          type: 'module',
          packageManager: 'pnpm@11.9.0',
        }),
      },
      dirs: ['/project/.git', '/project/.husky'],
      answers,
      commands: ({ cmd, args }) =>
        // `git diff --cached --quiet` exits 1 when there are staged changes.
        cmd === 'git' && args[0] === 'diff'
          ? { exitCode: 1, stdout: '', stderr: '' }
          : { exitCode: 0, stdout: '', stderr: '' },
    });

    return Effect.gen(function* () {
      yield* brew('/project');

      // Installs the deduplicated package set with the detected package manager.
      expect(env.runner.calls).toContainEqual({
        cmd: 'pnpm',
        args: [
          'add',
          '-D',
          'oxlint@1.0.0-test.oxlint',
          '@chanom/dev-config@1.0.0-test.dev-config',
          'oxfmt@1.0.0-test.oxfmt',
          'husky',
          'lint-staged',
          '@commitlint/cli',
          '@commitlint/config-conventional',
        ],
        cwd: '/project',
      });

      // Writes tool configs for an ESM project.
      expect(env.fs.files.has('/project/oxlint.config.ts')).toBe(true);
      expect(env.fs.files.has('/project/oxfmt.config.ts')).toBe(true);
      expect(env.fs.files.has('/project/knip.config.ts')).toBe(false);

      // Persists the merged scripts once.
      const pkg = JSON.parse(env.fs.files.get('/project/package.json') ?? '') as {
        scripts: Record<string, string>;
      };
      expect(pkg.scripts).toEqual({
        lint: 'oxlint',
        'lint:fix': 'oxlint --fix',
        format: 'oxfmt',
        'format:check': 'oxfmt --check',
      });

      // Wires the commit gate into the pre-existing .husky directory.
      expect(env.fs.files.get('/project/.husky/pre-commit')).toBe('lint-staged\n');
      expect(env.fs.files.get('/project/.husky/commit-msg')).toBe(
        'pnpm exec commitlint --edit $1\n',
      );
      expect(env.fs.files.has('/project/.lintstagedrc.json')).toBe(true);

      // Commits the staged changes without re-initializing git.
      expect(env.runner.calls).not.toContainEqual(
        expect.objectContaining({ cmd: 'git', args: ['init'] }),
      );
      expect(env.runner.calls).toContainEqual({
        cmd: 'git',
        args: ['commit', '-m', 'chore: setup chanom configuration'],
        cwd: '/project',
      });
      expect(env.prompter.log.spinners).toContainEqual(
        expect.objectContaining({ stop: 'Changes committed' }),
      );
      expect(env.prompter.log.outros[0]).toContain('oxlint, oxfmt');
    }).pipe(Effect.provide(env.layer));
  });

  it.effect('initializes git and writes .gitignore when not a repo', () => {
    const env = makeTestEnv({
      files: { '/project/package.json': '{}' },
      answers: {
        'Which toppings would you like?': [],
        'How sweet would you like it?': 'light',
      },
    });

    return Effect.gen(function* () {
      yield* brew('/project');
      expect(env.runner.calls).toContainEqual({ cmd: 'git', args: ['init'], cwd: '/project' });
      expect(env.fs.files.get('/project/.gitignore')).toBe('node_modules\n');
      // Nothing selected: no install, no config writes, nothing staged to commit.
      expect(env.runner.calls.filter((c) => c.cmd === 'pnpm')).toEqual([]);
      expect(env.prompter.log.spinners).toContainEqual(
        expect.objectContaining({ stop: 'Nothing to commit, skipping' }),
      );
    }).pipe(Effect.provide(env.layer));
  });

  it.effect('appends node_modules to an existing .gitignore without losing entries', () => {
    const env = makeTestEnv({
      files: {
        '/project/package.json': '{}',
        '/project/.gitignore': 'dist\n.env',
      },
      dirs: ['/project/.git'],
      answers: {
        'Which toppings would you like?': [],
        'How sweet would you like it?': 'light',
      },
    });

    return Effect.gen(function* () {
      yield* brew('/project');
      expect(env.fs.files.get('/project/.gitignore')).toBe('dist\n.env\nnode_modules\n');
      expect(env.prompter.log.spinners).toContainEqual(
        expect.objectContaining({ stop: 'node_modules added to .gitignore' }),
      );
    }).pipe(Effect.provide(env.layer));
  });

  it.effect('leaves .gitignore untouched when node_modules is already ignored', () => {
    const env = makeTestEnv({
      files: {
        '/project/package.json': '{}',
        '/project/.gitignore': 'node_modules/\ndist\n',
      },
      dirs: ['/project/.git'],
      answers: {
        'Which toppings would you like?': [],
        'How sweet would you like it?': 'light',
      },
    });

    return Effect.gen(function* () {
      yield* brew('/project');
      expect(env.fs.files.get('/project/.gitignore')).toBe('node_modules/\ndist\n');
    }).pipe(Effect.provide(env.layer));
  });

  it.effect('sets a local git identity when none is configured', () => {
    const env = makeTestEnv({
      files: { '/project/package.json': '{}' },
      dirs: ['/project/.git'],
      answers: {
        'Which toppings would you like?': [],
        'How sweet would you like it?': 'light',
      },
      commands: ({ cmd, args }) =>
        // `git var GIT_COMMITTER_IDENT` fails when no identity is configured.
        cmd === 'git' && args[0] === 'var'
          ? { exitCode: 128, stdout: '', stderr: '' }
          : { exitCode: 0, stdout: '', stderr: '' },
    });

    return Effect.gen(function* () {
      yield* brew('/project');
      expect(env.runner.calls).toContainEqual({
        cmd: 'git',
        args: ['config', 'user.name', 'Chanom'],
        cwd: '/project',
      });
      expect(env.runner.calls).toContainEqual({
        cmd: 'git',
        args: ['config', 'user.email', 'chanom@local'],
        cwd: '/project',
      });
    }).pipe(Effect.provide(env.layer));
  });

  it.effect('warns and keeps files staged when the commit fails', () => {
    const env = makeTestEnv({
      files: { '/project/package.json': '{}' },
      dirs: ['/project/.git'],
      answers: {
        'Which toppings would you like?': ['knip'],
        'How sweet would you like it?': 'light',
      },
      commands: ({ cmd, args }) => {
        if (cmd === 'git' && args[0] === 'diff') return { exitCode: 1, stdout: '', stderr: '' };
        if (cmd === 'git' && args[0] === 'commit') {
          return { exitCode: 1, stdout: '', stderr: 'hook rejected' };
        }
        return { exitCode: 0, stdout: '', stderr: '' };
      },
    });

    return Effect.gen(function* () {
      yield* brew('/project');
      expect(env.prompter.log.spinners).toContainEqual(
        expect.objectContaining({ stop: expect.stringContaining('Could not commit') }),
      );
      expect(env.prompter.log.warnings).toContainEqual(expect.stringContaining('hook rejected'));
    }).pipe(Effect.provide(env.layer));
  });

  it.effect('warns without detail when the failed commit produces no output', () => {
    const env = makeTestEnv({
      files: { '/project/package.json': '{}' },
      dirs: ['/project/.git'],
      answers: {
        'Which toppings would you like?': ['knip'],
        'How sweet would you like it?': 'light',
      },
      commands: ({ cmd, args }) => {
        if (cmd === 'git' && args[0] === 'diff') return { exitCode: 1, stdout: '', stderr: '' };
        if (cmd === 'git' && args[0] === 'commit') return { exitCode: 1, stdout: '', stderr: '' };
        return { exitCode: 0, stdout: '', stderr: '' };
      },
    });

    return Effect.gen(function* () {
      yield* brew('/project');
      expect(env.prompter.log.warnings).toContain(
        'Your files are staged - commit them manually when ready.',
      );
    }).pipe(Effect.provide(env.layer));
  });

  it.effect('fails with Cancelled when a prompt is aborted', () => {
    const env = makeTestEnv({
      files: { '/project/package.json': '{}' },
      dirs: ['/project/.git'],
    });

    return Effect.gen(function* () {
      const error = yield* Effect.flip(brew('/project'));
      expect(error._tag).toBe('Cancelled');
    }).pipe(Effect.provide(env.layer));
  });
});

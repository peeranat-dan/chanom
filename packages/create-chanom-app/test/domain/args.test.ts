import { describe, expect, it } from 'vitest';

import { parseArgs, validateProjectName } from '../../src/domain/args.ts';

const ok = (argv: string[]) => {
  const result = parseArgs(argv);
  if (!result.ok) throw new Error(`expected ok, got: ${result.message}`);
  return result.args;
};

describe('parseArgs', () => {
  it('defaults every optional flag to unset', () => {
    expect(ok([])).toEqual({ yes: false, help: false, version: false });
  });

  it('reads a positional directory and each boolean flag', () => {
    expect(ok(['my-app', '--git', '--commit-hooks', '--install'])).toEqual({
      directory: 'my-app',
      git: true,
      commitHooks: true,
      install: true,
      yes: false,
      help: false,
      version: false,
    });
  });

  it('reads the negated flags', () => {
    const args = ok(['--no-git', '--no-commit-hooks', '--no-install']);
    expect(args.git).toBe(false);
    expect(args.commitHooks).toBe(false);
    expect(args.install).toBe(false);
  });

  it('accepts -y and --yes plus help and version', () => {
    expect(ok(['-y']).yes).toBe(true);
    expect(ok(['--yes']).yes).toBe(true);
    expect(ok(['-h']).help).toBe(true);
    expect(ok(['--help']).help).toBe(true);
    expect(ok(['--version']).version).toBe(true);
  });

  it('reads a valid --pm value', () => {
    expect(ok(['--pm', 'yarn']).pm).toBe('yarn');
  });

  it('rejects a missing --pm value', () => {
    expect(parseArgs(['--pm'])).toEqual({ ok: false, message: '--pm requires a value.' });
  });

  it('rejects an unknown --pm value', () => {
    const result = parseArgs(['--pm', 'deno']);
    expect(result.ok).toBe(false);
    expect(result.ok === false && result.message).toMatch(/Unknown package manager "deno"/);
  });

  it('rejects an unknown option', () => {
    expect(parseArgs(['--nope'])).toEqual({ ok: false, message: 'Unknown option: --nope' });
  });

  it('rejects a second positional argument', () => {
    expect(parseArgs(['a', 'b'])).toEqual({
      ok: false,
      message: 'Unexpected extra argument: b',
    });
  });

  it('rejects the contradictory --no-git --commit-hooks pair', () => {
    const result = parseArgs(['--no-git', '--commit-hooks']);
    expect(result.ok).toBe(false);
    expect(result.ok === false && result.message).toMatch(/--commit-hooks requires a git repo/);
  });
});

describe('validateProjectName', () => {
  it('accepts a normal name and "." for the current directory', () => {
    expect(validateProjectName('my-app')).toBeUndefined();
    expect(validateProjectName('.')).toBeUndefined();
    expect(validateProjectName('app_2.0')).toBeUndefined();
  });

  it('rejects an empty name', () => {
    expect(validateProjectName('')).toBe('Please enter a project name.');
    expect(validateProjectName('   ')).toBe('Please enter a project name.');
  });

  it('rejects disallowed characters', () => {
    expect(validateProjectName('my app')).toMatch(/letters, numbers/);
    expect(validateProjectName('my/app')).toMatch(/letters, numbers/);
  });

  it('rejects a name starting with a dot (other than ".")', () => {
    expect(validateProjectName('.hidden')).toBe('Name cannot start with a dot.');
  });
});

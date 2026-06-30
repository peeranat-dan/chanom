import { spawnSync } from 'node:child_process';
import { existsSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export interface GitResult {
  ok: boolean;
  stdout: string;
  stderr: string;
}

function run(args: string[], cwd: string): GitResult {
  const { status, stdout, stderr } = spawnSync('git', args, {
    stdio: 'pipe',
    cwd,
    encoding: 'utf-8',
  });
  return {
    ok: status === 0,
    stdout: (stdout ?? '').trim(),
    stderr: (stderr ?? '').trim(),
  };
}

export function isGitRepo(cwd = process.cwd()): boolean {
  return existsSync(join(cwd, '.git'));
}

export function init(cwd: string): GitResult {
  return run(['init'], cwd);
}

/** True if git has a usable author identity (committer.name + committer.email). */
export function hasIdentity(cwd: string): boolean {
  return run(['var', 'GIT_COMMITTER_IDENT'], cwd).ok;
}

/** Set a repo-local identity so commits succeed on a fresh repo without global config. */
export function setLocalIdentity(cwd: string, name: string, email: string): void {
  run(['config', 'user.name', name], cwd);
  run(['config', 'user.email', email], cwd);
}

export function stageAll(cwd: string): GitResult {
  return run(['add', '.'], cwd);
}

/** True if there is anything staged to commit. */
export function hasStagedChanges(cwd: string): boolean {
  // diff --cached exits non-zero when there are staged changes.
  return !run(['diff', '--cached', '--quiet'], cwd).ok;
}

export function commit(cwd: string, message: string): GitResult {
  return run(['commit', '-m', message], cwd);
}

export function writeGitignore(cwd: string, contents = 'node_modules\n'): void {
  writeFileSync(join(cwd, '.gitignore'), contents, 'utf-8');
}

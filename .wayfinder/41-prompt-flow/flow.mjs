#!/usr/bin/env node
import { stdin, stdout } from 'node:process';
/* eslint-disable no-console -- throwaway prototype CLI: printing to the terminal is its entire job */
/**
 * PROTOTYPE for issue #41 — Design the prompt flow and CLI flags.
 *
 * Throwaway. Simulates the create-chanom-app interactive flow and prints the
 * flag table + --help so we have something concrete to react to. NOT the real
 * implementation — no scaffolding happens, prompts are faked with readline.
 *
 * Run: node .wayfinder/41-prompt-flow/flow.mjs            (interactive)
 *      node .wayfinder/41-prompt-flow/flow.mjs --help     (help sketch)
 *      node .wayfinder/41-prompt-flow/flow.mjs my-app --yes --no-commit-hooks
 */
import readline from 'node:readline/promises';

// --- picocolors-ish (no dep in the prototype) ---
const c = {
  dim: (s) => `\x1b[2m${s}\x1b[0m`,
  bold: (s) => `\x1b[1m${s}\x1b[0m`,
  cyan: (s) => `\x1b[36m${s}\x1b[0m`,
  green: (s) => `\x1b[32m${s}\x1b[0m`,
  magenta: (s) => `\x1b[35m${s}\x1b[0m`,
  red: (s) => `\x1b[31m${s}\x1b[0m`,
};

// ---------------------------------------------------------------------------
// FLAG TABLE — every flag mirrors an interactive prompt or a default.
// ---------------------------------------------------------------------------
const FLAGS = [
  ['[directory]', 'positional', 'Target directory / project name. Prompted if omitted.'],
  ['--commit-hooks', 'boolean', 'Add the commit-hooks topping (husky + lint-staged + commitlint).'],
  ['--no-commit-hooks', 'boolean', 'Skip the commit-hooks topping.'],
  [
    '--pm <pnpm|npm|yarn|bun>',
    'enum',
    'Package manager to record. Default: detected from the create invocation.',
  ],
  ['--install / --no-install', 'boolean', 'Run install after scaffolding. Default: install.'],
  [
    '--git / --no-git',
    'boolean',
    'git init + initial commit. Default: init. (--no-git disables commit-hooks.)',
  ],
  [
    '-y, --yes',
    'boolean',
    'Accept all defaults (git + hooks + install), no prompts (CI-friendly).',
  ],
  ['--help', 'boolean', 'Show help.'],
  ['--version', 'boolean', 'Show version.'],
];

function printHelp() {
  console.log(`
${c.bold('create-chanom-app')} ${c.dim('— scaffold a Vite + React + TS app')}

${c.bold('Usage')}
  ${c.cyan('npm create chanom-app@latest')} ${c.dim('[directory] [options]')}
  ${c.cyan('pnpm create chanom-app')} ${c.dim('[directory] [options]')}

${c.bold('Options')}`);
  for (const [flag, , desc] of FLAGS) {
    console.log(`  ${c.cyan(flag.padEnd(28))} ${desc}`);
  }
  console.log(`
${c.bold('Examples')}
  ${c.dim('# interactive')}
  ${c.cyan('pnpm create chanom-app')}
  ${c.dim('# fully non-interactive, CI')}
  ${c.cyan('pnpm create chanom-app my-app --yes --no-commit-hooks')}
  ${c.dim('# pick everything explicitly')}
  ${c.cyan('pnpm create chanom-app my-app --commit-hooks --pm pnpm --no-install')}
`);
}

// ---------------------------------------------------------------------------
// project name validation (react-to-me rules)
// ---------------------------------------------------------------------------
function validateName(name) {
  if (!name || name.trim() === '') return 'Please enter a project name.';
  if (name === '.') return null; // scaffold into cwd — allowed?  (open Q)
  if (!/^[a-z0-9._-]+$/i.test(name)) return 'Use letters, numbers, dots, dashes, underscores only.';
  if (name.startsWith('.')) return 'Name cannot start with a dot.';
  return null;
}

// ---------------------------------------------------------------------------
// PM detection — a create-* tool has NO target package.json yet, so detection
// is ONLY from npm_config_user_agent (the create launcher sets it), fallback pnpm.
// ---------------------------------------------------------------------------
function detectPm() {
  const agent = process.env.npm_config_user_agent ?? '';
  for (const pm of ['pnpm', 'yarn', 'bun', 'npm']) if (agent.startsWith(pm)) return pm;
  return 'pnpm'; // fallback
}

// Real impl reads the FS; prototype checks an env override so we can demo the abort.
import { existsSync, readdirSync } from 'node:fs';
function dirExistsNonEmpty(name) {
  if (name === '.' || name === undefined) return false;
  try {
    return existsSync(name) && readdirSync(name).length > 0;
  } catch {
    return false;
  }
}

function parseArgs(argv) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '-y' || a === '--yes') out.yes = true;
    else if (a === '--help' || a === '-h') out.help = true;
    else if (a === '--commit-hooks') out.commitHooks = true;
    else if (a === '--no-commit-hooks') out.commitHooks = false;
    else if (a === '--install') out.install = true;
    else if (a === '--no-install') out.install = false;
    else if (a === '--git') out.git = true;
    else if (a === '--no-git') out.git = false;
    else if (a === '--pm') out.pm = argv[++i];
    else if (!a.startsWith('-')) out._.push(a);
  }
  return out;
}

async function run() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) return printHelp();

  // Flag-conflict guard: commit hooks require a repo (husky installs into .git).
  if (args.git === false && args.commitHooks === true) {
    console.log();
    console.log(c.red('✖ --commit-hooks requires a git repo.'));
    console.log(c.dim('  Remove --no-git or --commit-hooks.'));
    process.exitCode = 1;
    return;
  }

  const detectedPm = detectPm();
  console.log();
  console.log(c.magenta('🧋  create-chanom-app'));

  // --- resolve values: flags win, then prompt (unless --yes), then default ---
  const rl = args.yes ? null : readline.createInterface({ input: stdin, output: stdout });
  const ask = async (q, def) => {
    if (!rl) return def;
    const ans = (await rl.question(`${c.cyan('?')} ${q} ${c.dim(`(${def})`)} `)).trim();
    return ans === '' ? def : ans;
  };
  const confirm = async (q, def) => {
    if (!rl) return def;
    const ans = (await rl.question(`${c.cyan('?')} ${q} ${c.dim(def ? '(Y/n)' : '(y/N)')} `))
      .trim()
      .toLowerCase();
    return ans === '' ? def : ans.startsWith('y');
  };

  // 1. project name / directory
  let name = args._[0];
  if (name === undefined) {
    name = await ask('Project name?', 'my-chanom-app');
    let err = validateName(name);
    while (err) {
      console.log(c.red(`  ${err}`));
      name = await ask('Project name?', 'my-chanom-app');
      err = validateName(name);
    }
  }

  // Refuse to scaffold into an existing non-empty directory (no silent clobber).
  // Real impl: fs.existsSync + readdirSync(name).length > 0. Sketched here.
  if (dirExistsNonEmpty(name)) {
    rl?.close();
    console.log();
    console.log(c.red(`✖ ${name} is not empty. Aborting.`));
    process.exitCode = 1;
    return;
  }

  // 2. git — asked BEFORE hooks because hooks require a repo (husky installs
  //    into .git). No repo -> the hooks prompt is not applicable, so it's skipped.
  const git = args.git ?? (await confirm('Initialize a git repository?', true));

  // 3. toppings — v1 has exactly one: commit hooks. GATED on git: only offered
  //    when a repo will exist. Passing --commit-hooks with --no-git is a conflict (see Q).
  const commitHooks = git
    ? (args.commitHooks ??
      (await confirm('Add commit hooks (husky + lint-staged + commitlint)?', true)))
    : false;

  // 4. post-scaffold install
  const install = args.install ?? (await confirm('Install dependencies now?', true));
  const pm = args.pm ?? detectedPm;

  rl?.close();

  // --- plan summary (react to defaults here) ---
  console.log();
  console.log(c.bold('  Plan'));
  console.log(`  ${c.dim('directory     ')} ${name}`);
  console.log(`  ${c.dim('package mgr   ')} ${pm} ${args.pm ? '' : c.dim('(detected)')}`);
  console.log(`  ${c.dim('git init      ')} ${git ? c.green('yes') : c.dim('no')}`);
  console.log(
    `  ${c.dim('commit hooks  ')} ${git ? (commitHooks ? c.green('yes') : c.dim('no')) : c.dim('n/a (no git)')}`,
  );
  console.log(`  ${c.dim('install       ')} ${install ? c.green('yes') : c.dim('no')}`);
  console.log();
  console.log(c.dim('  (prototype — nothing scaffolded)'));

  // --- next-steps outro sketch ---
  console.log();
  console.log(c.green(`  Done! Next steps:`));
  console.log(`    cd ${name}`);
  if (!install) console.log(`    ${pm} install`);
  console.log(`    ${pm} run dev`);
  console.log();
}

run();

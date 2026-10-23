import { workflowFile } from '@chanom/internal';
import { describe, expect, it } from 'vitest';

import {
  agentSkills,
  baseline,
  commitHooks,
  githubActions,
  selectContributions,
} from '../src/toppings.ts';

describe('baseline', () => {
  it('puts only react + react-dom in runtime dependencies (no chanom footprint)', () => {
    expect(baseline.dependencies).toEqual(['react', 'react-dom']);
  });

  it('wires the chanom configs as dev dependencies', () => {
    expect(baseline.devDependencies).toContain('@chanom/dev-config');
    expect(baseline.devDependencies).toContain('@chanom/vite-config');
  });

  it('contributes the react vite plugin', () => {
    expect(baseline.viteImports).toEqual(["import react from '@vitejs/plugin-react';"]);
    expect(baseline.vitePlugins).toEqual(['react()']);
  });

  it('ships .vscode settings and extension recommendations', () => {
    expect(baseline.files.map((file) => file.path)).toEqual([
      '.vscode/settings.json',
      '.vscode/extensions.json',
    ]);

    const settingsFile = baseline.files.find((file) => file.path === '.vscode/settings.json');
    const settings = JSON.parse(settingsFile?.contents ?? '{}') as Record<string, unknown>;
    expect(settings['editor.defaultFormatter']).toBe('oxc.oxc-vscode');
    // The generated app always ships oxfmt.config.ts, never the .mts variant.
    expect(settings['oxc.fmt.configPath']).toBe('oxfmt.config.ts');
    expect(settings['[typescript]']).toEqual({ 'editor.defaultFormatter': 'oxc.oxc-vscode' });

    const extensionsFile = baseline.files.find((file) => file.path === '.vscode/extensions.json');
    expect(JSON.parse(extensionsFile?.contents ?? '{}')).toEqual({
      recommendations: ['oxc.oxc-vscode'],
    });
  });
});

describe('commitHooks', () => {
  it('adds only the four hook dev dependencies and a prepare script', () => {
    const contribution = commitHooks('pnpm');
    expect(contribution.dependencies).toEqual([]);
    expect(contribution.devDependencies).toEqual([
      'husky',
      'lint-staged',
      '@commitlint/cli',
      '@commitlint/config-conventional',
    ]);
    expect(contribution.scripts).toEqual({ prepare: 'husky' });
  });

  it('writes the four hook/config files with the PM-specific commit-msg hook', () => {
    const paths = commitHooks('pnpm').files.map((file) => file.path);
    expect(paths).toEqual([
      '.husky/pre-commit',
      '.husky/commit-msg',
      '.lintstagedrc.json',
      '.commitlintrc.json',
    ]);
    const commitMsg = commitHooks('yarn').files.find((f) => f.path === '.husky/commit-msg');
    expect(commitMsg?.contents).toBe('yarn commitlint --edit $1\n');
  });
});

describe('agentSkills', () => {
  it('contributes skill files only - no packages or scripts', () => {
    expect(agentSkills.dependencies).toEqual([]);
    expect(agentSkills.devDependencies).toEqual([]);
    expect(agentSkills.scripts).toEqual({});
    expect(agentSkills.viteImports).toEqual([]);
    expect(agentSkills.vitePlugins).toEqual([]);
  });

  it('writes the coding-standards skill under .agents/skills', () => {
    const paths = agentSkills.files.map((file) => file.path);

    expect(paths).toContain('.agents/skills/coding-standards/SKILL.md');
    expect(paths.every((path) => path.startsWith('.agents/skills/'))).toBe(true);

    const skill = agentSkills.files.find(
      (file) => file.path === '.agents/skills/coding-standards/SKILL.md',
    );
    expect(skill?.contents).toMatch(/name: coding-standards/);
  });

  it('links .claude/skills at the .agents copy', () => {
    expect(agentSkills.links).toEqual([
      {
        path: '.claude/skills/coding-standards',
        target: '../../.agents/skills/coding-standards',
      },
    ]);
  });
});

describe('githubActions', () => {
  it('contributes only the shared CI workflow file', () => {
    const contribution = githubActions('npm', ['build'], true);
    expect(contribution.devDependencies).toEqual([]);
    expect(contribution.scripts).toEqual({});
    expect(contribution.files).toEqual([
      {
        path: '.github/workflows/ci.yml',
        contents: workflowFile({
          pm: 'npm',
          jobs: ['build'],
          hasNvmrc: false,
          hasPackageManagerField: true,
        }),
      },
    ]);
  });

  it('only runs scripts the baseline ships', () => {
    for (const job of ['lint', 'build', 'typecheck', 'test']) {
      expect(baseline.scripts[job]).toBeDefined();
    }
  });
});

const noToppings = {
  pm: 'pnpm',
  commitHooks: false,
  agentSkills: false,
  ciJobs: [],
  hasPackageManagerField: true,
} as const;

describe('selectContributions', () => {
  it('is baseline-only when every topping is off', () => {
    expect(selectContributions(noToppings)).toEqual([baseline]);
  });

  it('appends the commit-hooks topping when on', () => {
    const contributions = selectContributions({ ...noToppings, commitHooks: true });
    expect(contributions).toHaveLength(2);
    expect(contributions[0]).toBe(baseline);
  });

  it('appends the agent-skills topping when on', () => {
    const contributions = selectContributions({ ...noToppings, agentSkills: true });
    expect(contributions).toEqual([baseline, agentSkills]);
  });

  it('appends both toppings in fold order', () => {
    const contributions = selectContributions({
      ...noToppings,
      commitHooks: true,
      agentSkills: true,
    });
    expect(contributions).toHaveLength(3);
    expect(contributions[0]).toBe(baseline);
    expect(contributions[2]).toBe(agentSkills);
  });
});

describe('selectContributions with CI jobs', () => {
  it('appends the github-actions topping last when jobs are chosen', () => {
    const contributions = selectContributions({ ...noToppings, ciJobs: ['lint'] });
    expect(contributions).toEqual([baseline, githubActions('pnpm', ['lint'], true)]);
  });
});

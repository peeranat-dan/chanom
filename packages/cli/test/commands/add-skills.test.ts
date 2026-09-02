import { NodeContext } from '@effect/platform-node';
import { describe, expect, it } from '@effect/vitest';
import { Effect, Layer } from 'effect';
import { mkdtempSync, readFileSync, readlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  apply,
  planSkillFiles,
  SKILLS,
  skillFiles,
  skillLink,
} from '../../src/commands/add-skills/index.ts';
import { makeTestFs } from '../support/fs.ts';
import { makeTestPrompter } from '../support/prompter.ts';

const skillPath = '/project/.agents/skills/coding-standards/SKILL.md';
const referencePath = '/project/.agents/skills/coding-standards/references/react.md';
const linkPath = '/project/.claude/skills/coding-standards';

describe('planSkillFiles', () => {
  it('writes every file when none exist', () => {
    const files = [
      { path: 'a.md', contents: 'a' },
      { path: 'b.md', contents: 'b' },
    ];
    const plan = planSkillFiles(files, () => false);

    expect(plan.write).toEqual(files);
    expect(plan.skipped).toEqual([]);
  });

  it('skips files that already exist, keeping the rest', () => {
    const files = [
      { path: 'a.md', contents: 'a' },
      { path: 'b.md', contents: 'b' },
    ];
    const plan = planSkillFiles(files, (path) => path === 'a.md');

    expect(plan.write).toEqual([{ path: 'b.md', contents: 'b' }]);
    expect(plan.skipped).toEqual(['a.md']);
  });
});

describe('skillFiles', () => {
  it('roots every file under .agents/skills/<name>/', () => {
    for (const file of SKILLS.flatMap(skillFiles)) {
      expect(file.path.startsWith('.agents/skills/')).toBe(true);
      expect(file.contents.length).toBeGreaterThan(0);
    }
  });

  it('ships the coding-standards SKILL.md with frontmatter', () => {
    const files = skillFiles(SKILLS[0]);
    const entry = files.find((file) => file.path.endsWith('coding-standards/SKILL.md'));

    expect(entry?.contents).toMatch(/^---\nname: coding-standards\n/);
  });
});

describe('skillLink', () => {
  it('links .claude/skills/<name> at the .agents copy with a relative target', () => {
    expect(skillLink(SKILLS[0])).toEqual({
      path: '.claude/skills/coding-standards',
      target: '../../.agents/skills/coding-standards',
    });
  });

  it('resolves the relative target back to the real directory', () => {
    const link = skillLink(SKILLS[0]);
    const resolved = new URL(link.target, `file:///project/${link.path}`).pathname;

    expect(resolved).toBe('/project/.agents/skills/coding-standards');
  });
});

describe('apply', () => {
  it.effect('writes the skill files and links them into .claude', () => {
    const fs = makeTestFs();
    const prompter = makeTestPrompter();
    return Effect.gen(function* () {
      yield* apply('/project');

      expect(fs.files.get(skillPath)).toMatch(/name: coding-standards/);
      expect(fs.files.get(referencePath)).toMatch(/# React/);
      expect(fs.symlinks.get(linkPath)).toBe('../../.agents/skills/coding-standards');
      expect(prompter.log.warnings).toEqual([]);
    }).pipe(Effect.provide(Layer.mergeAll(fs.layer, prompter.layer)));
  });

  it.effect('keeps an existing file untouched and warns', () => {
    const fs = makeTestFs({ [skillPath]: 'my own standards\n' });
    const prompter = makeTestPrompter();
    return Effect.gen(function* () {
      yield* apply('/project');

      expect(fs.files.get(skillPath)).toBe('my own standards\n');
      // The other files are still written.
      expect(fs.files.get(referencePath)).toMatch(/# React/);
      expect(prompter.log.warnings).toEqual([
        '`.agents/skills/coding-standards/SKILL.md` already exists - skipping',
      ]);
    }).pipe(Effect.provide(Layer.mergeAll(fs.layer, prompter.layer)));
  });

  it.effect('leaves an existing .claude/skills entry alone and warns', () => {
    // A real directory at the link path - the user maintains it by hand.
    const fs = makeTestFs({ [`${linkPath}/SKILL.md`]: 'hand-written\n' });
    const prompter = makeTestPrompter();
    return Effect.gen(function* () {
      yield* apply('/project');

      expect(fs.symlinks.has(linkPath)).toBe(false);
      expect(fs.files.get(`${linkPath}/SKILL.md`)).toBe('hand-written\n');
      expect(prompter.log.warnings).toEqual([
        '`.claude/skills/coding-standards` already exists - skipping link',
      ]);
    }).pipe(Effect.provide(Layer.mergeAll(fs.layer, prompter.layer)));
  });
});

/**
 * The in-memory FileSystem records `symlink` without resolving it, so this
 * exercises the real one: the link must actually resolve to the `.agents` copy,
 * and a second run must leave it intact.
 */
describe('apply on a real filesystem', () => {
  it.effect('creates a link that resolves, and survives a re-run', () => {
    const dir = mkdtempSync(join(tmpdir(), 'chanom-skills-'));
    const prompter = makeTestPrompter();
    return Effect.gen(function* () {
      yield* apply(dir);

      const link = join(dir, '.claude/skills/coding-standards');
      expect(readlinkSync(link)).toBe('../../.agents/skills/coding-standards');
      expect(readFileSync(join(link, 'SKILL.md'), 'utf-8')).toMatch(/name: coding-standards/);

      yield* apply(dir);
      expect(readlinkSync(link)).toBe('../../.agents/skills/coding-standards');
      expect(prompter.log.warnings).toContain(
        '`.claude/skills/coding-standards` already exists - skipping link',
      );
    }).pipe(Effect.provide(Layer.merge(NodeContext.layer, prompter.layer)));
  });
});

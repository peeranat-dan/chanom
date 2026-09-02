/** One file of an installable agent skill. */
export interface SkillFile {
  /** Path within the skill directory, posix separators, e.g. `references/react.md`. */
  readonly path: string;
  readonly contents: string;
}

/** An agent skill chanom can install into a project's `.claude/skills/`. */
export interface Skill {
  /** Directory name under `.claude/skills/`. */
  readonly name: string;
  readonly files: readonly SkillFile[];
}

/**
 * The coding-standards skill, targeting the stack `create-chanom-app` scaffolds
 * (Vite + React + TypeScript, oxlint, oxfmt, vitest). Its markdown is authored
 * as real `.md` files under `skills/coding-standards/` and inlined here at
 * build time through the `__CODING_STANDARDS_FILES__` define, so `chanom brew`
 * and `create-chanom-app` install byte-identical content from one source.
 */
export const codingStandardsSkill: Skill = {
  name: 'coding-standards',
  files: __CODING_STANDARDS_FILES__,
};

/** Every skill chanom can install, in install order. */
export const SKILLS: readonly Skill[] = [codingStandardsSkill];

/** Directory holding the real skill files, agent-agnostic. */
export const SKILLS_ROOT = '.agents/skills';

/** Directory Claude Code reads skills from; its entries are links into {@link SKILLS_ROOT}. */
export const CLAUDE_SKILLS_ROOT = '.claude/skills';

/** Files a skill writes, rooted at `.agents/skills/<name>/`. */
export function skillFiles(skill: Skill): SkillFile[] {
  return skill.files.map((file) => ({
    path: `${SKILLS_ROOT}/${skill.name}/${file.path}`,
    contents: file.contents,
  }));
}

/** A symlink in `.claude/skills/` pointing at the real skill directory. */
export interface SkillLink {
  /** Link path relative to the project root. */
  readonly path: string;
  /**
   * Link target, relative to the link's own directory - so the pair survives
   * being moved, copied, or committed to git as a relative link.
   */
  readonly target: string;
}

/**
 * The `.claude/skills/<name>` link for a skill. Real files live under
 * `.agents/skills/` so any agent tool can read them; Claude Code only looks in
 * `.claude/skills/`, so it gets a link rather than a second copy.
 */
export function skillLink(skill: Skill): SkillLink {
  return {
    path: `${CLAUDE_SKILLS_ROOT}/${skill.name}`,
    target: `../../${SKILLS_ROOT}/${skill.name}`,
  };
}

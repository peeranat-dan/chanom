/**
 * The installable skill definitions live in `@chanom/internal` so `chanom brew`
 * and `create-chanom-app` write byte-identical skill files. This module
 * re-exports them to keep the command's `logic.ts` boundary intact.
 */
export {
  CLAUDE_SKILLS_ROOT,
  codingStandardsSkill,
  type Skill,
  type SkillFile,
  type SkillLink,
  skillFiles,
  skillLink,
  SKILLS,
  SKILLS_ROOT,
} from '@chanom/internal';

/** Files that already exist and were left untouched, split from those to write. */
export interface SkillPlan {
  readonly write: readonly { readonly path: string; readonly contents: string }[];
  readonly skipped: readonly string[];
}

/**
 * Splits the skill's files by whether they are already on disk. Existing files
 * always win: a user who has edited the standards to fit their project keeps
 * those edits, so re-running `chanom brew` is safe.
 */
export function planSkillFiles(
  files: readonly { readonly path: string; readonly contents: string }[],
  exists: (path: string) => boolean,
): SkillPlan {
  const write: { readonly path: string; readonly contents: string }[] = [];
  const skipped: string[] = [];

  for (const file of files) {
    if (exists(file.path)) {
      skipped.push(file.path);
    } else {
      write.push(file);
    }
  }

  return { write, skipped };
}

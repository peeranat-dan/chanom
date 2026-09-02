import { Prompter } from '@chanom/internal';
import { FileSystem, Path } from '@effect/platform';
import { Effect } from 'effect';

import { planSkillFiles, SKILLS, skillFiles, type SkillLink, skillLink } from './logic.ts';

export {
  CLAUDE_SKILLS_ROOT,
  planSkillFiles,
  skillFiles,
  skillLink,
  SKILLS,
  SKILLS_ROOT,
} from './logic.ts';

/**
 * Links `.claude/skills/<name>` at the real directory under `.agents/skills/`.
 * Anything already at the link path - a link the user already has, or a real
 * directory they maintain by hand - is left alone and reported.
 */
const linkSkill = Effect.fn('add-skills.linkSkill')(function* (cwd: string, link: SkillLink) {
  const fs = yield* FileSystem.FileSystem;
  const path = yield* Path.Path;
  const prompter = yield* Prompter;

  const linkPath = path.join(cwd, link.path);
  if (yield* fs.exists(linkPath)) {
    yield* prompter.warn(`\`${link.path}\` already exists - skipping link`);
    return;
  }

  yield* fs.makeDirectory(path.dirname(linkPath), { recursive: true });
  // The target stays relative so the link keeps working wherever the project
  // is checked out.
  yield* fs.symlink(link.target, linkPath);
});

/**
 * Writes every chanom skill into `.agents/skills/`, then links it into
 * `.claude/skills/`. Files already on disk are left untouched, so re-running is
 * safe. Contributes no packages and no scripts, so - like `add-vscode` - it
 * returns nothing for the caller to persist.
 */
export const apply = Effect.fn('add-skills.apply')(function* (cwd: string) {
  const fs = yield* FileSystem.FileSystem;
  const path = yield* Path.Path;
  const prompter = yield* Prompter;

  const files = SKILLS.flatMap(skillFiles);

  // `exists` is async, so the presence check is resolved up front and the pure
  // planner receives a plain lookup.
  const present = new Set<string>();
  for (const file of files) {
    if (yield* fs.exists(path.join(cwd, file.path))) present.add(file.path);
  }

  const plan = planSkillFiles(files, (filePath) => present.has(filePath));

  for (const skipped of plan.skipped) {
    yield* prompter.warn(`\`${skipped}\` already exists - skipping`);
  }

  for (const file of plan.write) {
    const dest = path.join(cwd, file.path);
    yield* fs.makeDirectory(path.dirname(dest), { recursive: true });
    yield* fs.writeFileString(dest, file.contents);
  }

  for (const skill of SKILLS) {
    yield* linkSkill(cwd, skillLink(skill));
  }
});

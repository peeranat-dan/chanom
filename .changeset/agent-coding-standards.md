---
'create-chanom-app': minor
'@chanom/cli': minor
---

Add an installable `coding-standards` agent skill, via a new `agent-skills` topping in `create-chanom-app` (`--agent-skills` / `--no-agent-skills`) and a `skills` topping in `chanom brew`. The skill targets the stack chanom scaffolds: a router `SKILL.md` plus TypeScript, React, and Vitest references. Files land in `.agents/skills/` so any agent tool can read them, with `.claude/skills/coding-standards` a relative symlink pointing at them. Existing files and links are reported and left untouched, so re-running never overwrites standards you have edited.

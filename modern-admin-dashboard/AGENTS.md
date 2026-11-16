# Agent Instructions

Skills come from the Home Repo at `../home` (linked as `.claude/skills/`
and `.agents/skills/`). Their generic conventions live in
`../home/skills/matt-pocock/setup-matt-pocock-skills/`. This file records
only what is specific to this project.

## Skill configuration

- **Project root:** `modern-admin-dashboard/`, a folder of the
  `software-development` git repo. Every path below is relative to it, not
  to the git root.
- **Context mode:** single-context.
- **Glossary:** `GLOSSARY.md`.
- **ADRs:** `docs/adr/`.
- **Issue tracker:** local markdown, one directory per feature under
  `.scratch/<feature-slug>/`; spec at `.scratch/<feature-slug>/spec.md`,
  tickets at `.scratch/<feature-slug>/issues/<NN>-<slug>.md`.
- **Triage roles:** the five canonical strings, unmapped
  (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`,
  `wontfix`), recorded as a `Status:` line in each issue file.

## Design docs

Read `docs/brief.md` (specifications and view states) and `DESIGN.md`
(tokens and styling rules) before writing or refactoring UI markup,
styling, or frontend components.

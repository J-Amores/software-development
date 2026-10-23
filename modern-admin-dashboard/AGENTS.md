# Agent Instructions

## Agent skills

### Issue tracker

Issues and specs live as local markdown files under `.scratch/<feature-slug>/`. See `docs/agents/issue-tracker.md`.

### Triage labels

Five canonical triage roles (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context (`GLOSSARY.md` and `docs/adr/` at the repo root). See `docs/agents/domain.md`.

### UI Development & Stitch Design Audit Gate

- **Pre-requisite Context:** All future agent interactions MUST read `docs/brief.md` (specifications & view states) and `DESIGN.md` (tokens & styling rules) before writing or refactoring any UI markup, styling, or frontend components.
- **Mandatory Quality Gate:** You MUST execute the design review gate defined in `.agent/skills/stitch-review/SKILL.md` across the three mandatory viewports:
  - **Desktop:** `1440 x 900`
  - **Tablet:** `768 x 1024`
  - **Mobile:** `375 x 812`
- **Zero Tolerance Policy:** Zero horizontal scroll (`scrollWidth <= clientWidth`) on mobile/tablet and zero token drift are required. No UI issue, feature branch, or pull request may be marked complete until all P0 (layout breakage/overflow) and P1 (token drift) items are fully resolved and verified.

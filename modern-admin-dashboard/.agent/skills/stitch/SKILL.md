---
name: stitch
description: Project-local Google Stitch generator and token sync. Lints DESIGN.md, syncs tokens to Stitch, prompts screen generation from docs/brief.md, explores layout variants, and extracts assets.
---

# Stitch: Project-Local Generator & Token Sync

This skill operates Google Stitch directly within the repository using locally installed devDependencies. It manages the full lifecycle of translating specifications into generative UI screens, syncing design tokens, producing layout variants, and extracting production code and visual assets.

## Core Constraints & Execution Rules

1. **Self-Contained Execution:** Never install global npm packages. Never write to user-level configuration directories (`~/.claude`, `~/.agent`, etc.).
2. **Local Binary Invocation:** Always run Stitch strictly via `npx stitch` from the project root.
3. **Design System Source of Truth:** `DESIGN.md` is the authoritative source for tokens and styling rules. Always lint before syncing or generating.
4. **Specification Source of Truth:** `docs/brief.md` is the authoritative specification for software application views and component states.

---

## Prerequisites & Status Verification

Check CLI and authentication status before triggering generation workflows:

```bash
npx stitch status
```

- If `Status: Configured`, proceed with commands.
- If authentication is missing or expired, instruct the user to run `npx stitch login` in their local terminal to authenticate via browser PKCE or set the `STITCH_API_KEY` environment variable.

---

## Workflows

### 1. Lint Design Tokens & Guidelines

Validate `DESIGN.md` for structural correctness, schema compliance, contrast ratios, and token formatting:

```bash
npx @google/design.md lint DESIGN.md
```

- Fix any errors or missing required tokens before proceeding.
- Summary should return `0 errors, 0 warnings`.

### 2. Sync Tokens to Stitch Design System

Synchronize the tokens defined in `DESIGN.md` into Stitch:

```bash
# Direct design system creation from DESIGN.md
npx stitch create design-system --from-file DESIGN.md

# When linking to an active Stitch canvas project:
npx stitch upload design DESIGN.md --project <project-id>
```

Verify that primary colors (`#0F172A`), accent (`#2563EB`), surface (`#FFFFFF`), background (`#F8FAFC`), typography pairings (Inter + JetBrains Mono), and radii (`6px`, `8px`, `12px`) are reflected in the target project.

### 3. Generate Application Screens from Brief

Generate new UI screens driven by the user jobs, screen inventory, and states detailed in `docs/brief.md`:

```bash
# Generate a desktop screen for a specific view defined in docs/brief.md
npx stitch generate screen \
  --project <project-id> \
  --device DESKTOP \
  --title "Executive Overview" \
  --prompt "$(cat docs/brief.md)"

# Or generate for mobile viewports
npx stitch generate screen \
  --project <project-id> \
  --device MOBILE \
  --title "Executive Overview (Mobile)" \
  --prompt "$(cat docs/brief.md)"
```

Key considerations during generation:

- Ensure the prompt highlights the specific state to produce: Empty, Loading Skeleton, Populated, or Error Banner.
- Adhere to the Slate functional aesthetic and high data density guidelines.

### 4. Generate Layout Alternatives & Variants

Explore layout variations for existing screens to test density, bento arrangement, or collapsed drawer navigation:

```bash
npx stitch generate variants \
  --project <project-id> \
  --screen <screen-id> \
  --count 3 \
  --creative-range REFINE \
  --aspects LAYOUT \
  --prompt "Refine layout for high data density, slate cards, collapsible drawer, zero horizontal overflow"
```

Options:

- `--creative-range REFINE`: Keeps branding and tokens strict while adjusting structural placement.
- `--aspects LAYOUT`: Isolates changes to positioning, card boundaries, grid columns, and responsiveness without drifting colors or fonts.

### 5. Extract Code, Images, and Font Assets

Extract generated screens, markup, reference snapshots, and associated assets into the workspace:

```bash
# Retrieve screen details and markup
npx stitch get screen <screen-id> --project <project-id> --json

# Download generated screen assets or preview capture
npx stitch capture <screen-url> -o docs/previews/<screen-name>.html
```

Extraction Steps:

1. Extract semantic HTML/JSX components and place into `web/src/components/`.
2. Map Stitch styles to repository tokens (CSS variables / Tailwind utility classes adhering to `DESIGN.md`).
3. Store downloaded visual reference images under `docs/assets/stitch/`.
4. Ensure imported fonts (Inter, JetBrains Mono) are linked in `web/index.html` or bundled locally.
5. Run test suite and design review gate (`.agent/skills/stitch-review/SKILL.md`).

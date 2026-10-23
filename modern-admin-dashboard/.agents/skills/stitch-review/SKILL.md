---
name: stitch-review
description: Responsive layout, horizontal overflow, and token fidelity gate. Lints DESIGN.md, captures snapshots across Desktop (1440x900), Tablet (768x1024), and Mobile (375x812) viewports, enforces zero horizontal scroll, validates design tokens, and generates severity-ranked audit reports.
---

# Stitch Review: Responsive Layout & Token Fidelity Gate

This skill acts as an automated visual and architectural gatekeeper. It guarantees that any UI implementation satisfies the design specifications in `DESIGN.md` and `docs/brief.md`, prevents layout breakages, and eliminates token drift before code changes can be merged.

## Core Responsibilities

1. **Design Token Linting:** Ensures `DESIGN.md` remains structurally valid and error-free.
2. **Multi-Viewport Visual Auditing:** Tests pages across three mandatory viewports:
   - **Desktop:** `1440 x 900`
   - **Tablet:** `768 x 1024`
   - **Mobile:** `375 x 812`
3. **Zero Horizontal Overflow Enforcement:** Guarantees `document.documentElement.scrollWidth <= document.documentElement.clientWidth` across tablet and mobile viewports.
4. **Token Fidelity Verification:** Validates background shades, slate colors, typography rules, border radii, and accent usage.
5. **Quality Gate:** Blocks pull request completion or issue sign-off on any unresolved P0 or P1 defect.

---

## Audit Workflow

### Step 1: Lint Design Tokens

Run the local design linter against `DESIGN.md`:

```bash
npx @google/design.md lint DESIGN.md
```

- **Pass Condition:** 0 errors, 0 warnings.
- If errors exist (e.g. broken references, invalid syntax, missing primary colors), the gate immediately fails.

---

### Step 2: Boot Local Server & Capture Viewport Snapshots

Start the development environment and capture high-resolution full-page screenshots at each mandatory breakpoint:

```bash
# Verify local server boots cleanly or run via Playwright test runner
pnpm test:e2e
```

Or execute an automated Playwright audit script targeting the three viewports:

```js
// audit.spec.js / Playwright snippet
const viewports = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'mobile', width: 375, height: 812 }
];

for (const vp of viewports) {
  await page.setViewportSize({ width: vp.width, height: vp.height });
  await page.goto('http://localhost:5173');
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: `test-results/audit-${vp.name}.png`, fullPage: true });
}
```

---

### Step 3: Zero Horizontal Scroll Inspection

Execute the DOM evaluation script on tablet and mobile viewports to detect overflow:

```js
const overflowInfo = await page.evaluate(() => {
  const doc = document.documentElement;
  const hasOverflow = doc.scrollWidth > doc.clientWidth;
  const overflowingElements = [];

  if (hasOverflow) {
    const all = document.querySelectorAll('*');
    for (const el of all) {
      if (el.scrollWidth > doc.clientWidth || el.getBoundingClientRect().right > doc.clientWidth) {
        overflowingElements.push({
          tag: el.tagName,
          id: el.id,
          className: el.className,
          scrollWidth: el.scrollWidth,
          clientWidth: doc.clientWidth
        });
      }
    }
  }

  return { hasOverflow, overflowingElements };
});
```

- **Pass Condition:** `overflowInfo.hasOverflow === false`.
- Any overflowing element is flagged as **P0: Layout breakage**.

---

### Step 4: Token Fidelity Checks Against DESIGN.md

Evaluate computed styles of key UI primitives:

1. **Background & Surface:**
   - App canvas must use background token `#F8FAFC`.
   - Cards/Containers must use surface token `#FFFFFF` framed by `#E2E8F0` border.
   - Banned: decorative neon gradients, harsh drop shadows, or unstyled card overflow.
2. **Typography:**
   - Navigational elements, section headers, and prose must use `Inter`.
   - Numeric KPIs, timestamps, metric badges, and data tables must use `JetBrains Mono` with tabular numbers.
3. **Corner Radii:**
   - Inputs, buttons, and sub-components: `sm: 6px` or `md: 8px`.
   - Cards, tables, and modal containers: `lg: 12px`.
4. **Accent & Status Colors:**
   - Primary interactive actions: `#2563EB` (Accent) / `#0F172A` (Primary Slate).
   - Positive/success indicators: `#059669`.
   - Danger/alert indicators: `#DC2626`.
5. **Drawer & Navigation Behavior:**
   - Below `768px`, desktop sidebar must collapse into a hidden drawer or slide-over menu with a toggle button. No permanent 240px+ sidebar taking up horizontal width on mobile/tablet.

---

### Step 5: Severity-Ranked Audit Report

Generate a structured audit report summarizing all findings into the following categories:

| Severity | Category | Description | Merge Blocker? |
|---|---|---|---|
| **P0** | **Layout Breakage / Overflow** | Horizontal scroll on mobile/tablet (`scrollWidth > clientWidth`), unstyled container overflow, invisible interactive elements, broken breakpoint rendering. | **YES (Blocks PR)** |
| **P1** | **Token Drift** | Misaligned colors, font family mismatch (e.g. Arial/system-ui instead of Inter/JetBrains Mono), non-spec radii, missing focus indicators. | **YES (Blocks PR)** |
| **P2** | **Polish & Micro-interactions** | Subtle spacing misalignment, non-optimal transition easing, minor contrast enhancement. | NO (Advisory) |

#### Report Format

```markdown
# Stitch Review Audit Report

**Date:** YYYY-MM-DD
**Target URL/Branch:** <branch-or-url>
**Overall Status:** [PASS | BLOCKED]

## 1. Viewport Snapshot Summary
- Desktop (1440x900): PASS
- Tablet (768x1024): PASS
- Mobile (375x812): PASS

## 2. Horizontal Scroll Audit
- Desktop: 1440px / 1440px (Zero overflow)
- Tablet: 768px / 768px (Zero overflow)
- Mobile: 375px / 375px (Zero overflow)

## 3. Token Fidelity Verification
- Colors & Slate Background: Verified (#F8FAFC canvas, #FFFFFF card, #0F172A primary)
- Typography: Verified (Inter body/headings, JetBrains Mono numbers)
- Border Radii: Verified (6px sm, 8px md, 12px lg)
- Gradients: None detected (Clean functional slate aesthetic)

## 4. Issues Detected
- [P0] None
- [P1] None
- [P2] (Optional polish items)

**Conclusion:** [Approved for Merge | Changes Requested]
```

**PR Gate Rule:** A PR or issue implementation cannot be finalized or signed off until all P0 and P1 issues are resolved and verified.

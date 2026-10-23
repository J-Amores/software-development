---
name: Executive Kinetic Carbon
version: 1.0.0
colors:
  primary: "#6366F1"
  secondary: "#10B981"
  accent: "#6366F1"
  surface: "#14161F"
  background: "#0C0D12"
  border: "#222536"
  danger: "#EF4444"
  success: "#10B981"
typography:
  headline-display:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: 600
    lineHeight: 1.2
  headline-lg:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: 600
    lineHeight: 1.3
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: 600
    lineHeight: 1.4
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.5
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.5
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: 400
    lineHeight: 1.5
  mono-code:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: 400
    lineHeight: 1.4
  mono-numbers:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: 500
    lineHeight: 1.4
rounded:
  sm: 6px
  md: 8px
  lg: 12px
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
---

## Overview

Executive Kinetic Carbon is an operational, high-density executive dashboard design system inspired by LUNO Admin, built for precision, rapid telemetry scanning, and rock-solid responsive reliability.

### Visual Aesthetic & Philosophy

- **Obsidian Executive Carbon:** Interfaces emphasize an authoritative dark mode palette anchored in obsidian carbon (`#0C0D12` canvas and `#14161F` cards), elevated panels (`#1B1E2B`), electric indigo primary actions (`#6366F1`), and emerald jade status indicators (`#10B981`).
- **High Data Density:** Whitespace is disciplined and purposeful. Bento-style modular groupings, compact data tables, and structured KPI widgets present mission-critical telemetry without needless fluff or cognitive drag.
- **Zero Decorative Gimmicks:** Visual hierarchy is established solely through tonal stratification, specular hairline framing (`box-shadow: inset 0 1px 0 0 rgba(255, 255, 255, 0.07)`), and cryptographic tabular numbers.

## Colors

The color palette prioritizes high contrast (meeting WCAG AA standards), legible data presentation, and explicit status communication.

- **Primary (`#6366F1`):** Electric indigo foundation for primary interactive affordances, active navigation pills, and critical highlights.
- **Secondary (`#10B981`):** Emerald jade for healthy status indicators, positive delta pills, and completed tasks.
- **Accent (`#6366F1`):** Electric indigo accent reserved for key interactive actions.
- **Surface (`#14161F`):** Deep carbon container canvas for content cards, data tables, and bento modules.
- **Background (`#0C0D12`):** Obsidian dark application canvas base providing contrast under elevated cards.
- **Border (`#222536`):** Hairline 1px border for containers, cards, table row dividers, and input strokes.
- **Danger (`#EF4444`):** Vibrant red for error states, destructive triggers, and negative operational alerts.
- **Success (`#10B981`):** Emerald jade for positive delta pills and healthy metrics.

## Typography

Typography enforces a strict semantic separation between prose UI navigation and computational telemetry.

- **Inter:** Drives all navigational labels, structural section headers, and prose content. Neutral, highly legible geometric curves sustain readability across complex multi-panel dashboard views.
- **JetBrains Mono:** Dedicated to numeric KPIs, telemetry status, financial values, timestamps, and data tables. Must always be configured with tabular lining numbers (`font-feature-settings: "tnum" on, "zero" on`) to guarantee rigid vertical column alignment across live recalculating data.

## Layout & Spacing

Information is organized in responsive modular layouts designed to maximize screen utility and eliminate accidental layout shift.

### Breakpoint Constraints & Navigation

- **Desktop (1280px+ & 1440px):** Permanent 240px or 256px left navigation rail paired with a fluid multi-column grid canvas. Gutters utilize `spacing.lg` (`24px`).
- **Tablet (768px - 1279px):** Navigation rail collapses into an icon strip or responsive drawer. Bento cards reflow into 2-column aggregates.
- **Mobile (<768px):** Navigation collapses completely into a sliding drawer triggered by a persistent header hamburger button. All bento modules stack vertically into a single fluid stream with `spacing.md` (`16px`) padding. Zero horizontal scrolling is strictly enforced (`scrollWidth <= clientWidth`).

### Container & Overflow Rules

- **No Unstyled Card Overflow:** Cards and tables must handle internal overflowing content gracefully using scroll containers (`overflow-x-auto` with styled scrollbars) or text truncation (`truncate`). Content must never push past the parent container bounds or trigger viewport horizontal scroll.

## Elevation & Depth

Depth is constructed via subtle tonal layering and razor-thin hairline borders rather than heavy drop shadows.

- **Level 0 (App Canvas):** Flat `#0C0D12` obsidian canvas.
- **Level 1 (Cards & Bento Modules):** `#14161F` surface bounded by a 1px solid `#222536` stroke with specular highlight (`inset 0 1px 0 0 rgba(255, 255, 255, 0.07)`).
- **Level 2 (Dropdowns & Popovers):** `#1B1E2B` with `box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3)` and 1px `#222536` border.
- **Level 3 (Modal Dialogs):** `#14161F` elevated above a `rgba(0, 0, 0, 0.65)` backdrop overlay, bounded by `0 8px 24px -4px rgba(0, 0, 0, 0.6)`.

## Shapes

A clean, modern geometric profile reinforces developer-grade utility.

- **Inputs, Buttons, Badges (`rounded.sm` / `rounded.md`):** `6px` or `8px` corner radius provides engineered crispness.
- **Cards, Bento Containers, Tables (`rounded.lg`):** `12px` corner radius delivers consistent container framing.
- **Status Pills & Chips:** Fully rounded (`rounded-full` / `9999px`) to contrast against rectangular cards.

## Components

### Buttons

- **Primary:** Background `#6366F1`, text `#FFFFFF`, font Inter 500 weight, radius `6px` (`rounded.sm`), padding `8px 16px`. Focus ring: `2px solid #6366F1`.
- **Secondary / Ghost:** Background transparent, border 1px solid `#222536`, text `#E5E1E4`, hover background `#1B1E2B`.

### Data Cards & Bento Modules

- Elevated `#14161F` surface, 1px solid `#222536` border with specular hairline, `12px` corner radius, internal padding `16px` to `24px`.
- Card headers feature uppercase section labels (`Inter 12px font-semibold text-secondary`), followed by large numeric metric readouts (`JetBrains Mono 24px font-semibold text-primary`).

### Data Tables

- Clean carbon container with `#222536` hairline dividers.
- Numeric columns right-aligned with JetBrains Mono tabular numbers.
- Responsive wrapping: below 768px, tables enable horizontal scrolling inside the card container with visible scroll indicators.

## Do's and Don'ts

### Do's

- Do maintain high information density with compact spacing (`xs: 4px`, `sm: 8px`, `md: 16px`).
- Do use tabular lining numbers (`JetBrains Mono`) for all financial, KPI, timestamp, and numeric tabular data.
- Do collapse the navigation sidebar into a slide-over drawer below 768px.
- Do enforce zero horizontal scroll across the entire HTML document on mobile and tablet.
- Do use hairline `#222536` borders with specular highlights for card and module definition.

### Don'ts

- Don't use decorative neon gradients (e.g., purple-to-pink or cyan-to-lime glow effects).
- Don't allow unstyled card overflow that bleeds outside container boundaries.
- Don't keep a fixed 240px desktop sidebar visible on viewports narrower than 768px.
- Don't use heavy, muddy drop shadows to convey depth.
- Don't mix random border radii across components (strictly adhere to 6px, 8px, and 12px).

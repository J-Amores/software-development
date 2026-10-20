---
name: Executive Kinetic Carbon
colors:
  surface: "#131315"
  surface-dim: "#131315"
  surface-bright: "#39393b"
  surface-container-lowest: "#0e0e10"
  surface-container-low: "#1c1b1d"
  surface-container: "#201f22"
  surface-container-high: "#2a2a2c"
  surface-container-highest: "#353437"
  on-surface: "#e5e1e4"
  on-surface-variant: "#c7c4d7"
  inverse-surface: "#e5e1e4"
  inverse-on-surface: "#313032"
  outline: "#908fa0"
  outline-variant: "#464554"
  surface-tint: "#c0c1ff"
  primary: "#c0c1ff"
  on-primary: "#1000a9"
  primary-container: "#8083ff"
  on-primary-container: "#0d0096"
  inverse-primary: "#494bd6"
  secondary: "#4edea3"
  on-secondary: "#003824"
  secondary-container: "#00a572"
  on-secondary-container: "#00311f"
  tertiary: "#7bd0ff"
  on-tertiary: "#00354a"
  tertiary-container: "#009bd1"
  on-tertiary-container: "#002d40"
  error: "#ffb4ab"
  on-error: "#690005"
  error-container: "#93000a"
  on-error-container: "#ffdad6"
  primary-fixed: "#e1e0ff"
  primary-fixed-dim: "#c0c1ff"
  on-primary-fixed: "#07006c"
  on-primary-fixed-variant: "#2f2ebe"
  secondary-fixed: "#6ffbbe"
  secondary-fixed-dim: "#4edea3"
  on-secondary-fixed: "#002113"
  on-secondary-fixed-variant: "#005236"
  tertiary-fixed: "#c4e7ff"
  tertiary-fixed-dim: "#7bd0ff"
  on-tertiary-fixed: "#001e2c"
  on-tertiary-fixed-variant: "#004c69"
  background: "#131315"
  on-background: "#e5e1e4"
  surface-variant: "#353437"
typography:
  display-hero:
    fontFamily: Inter
    fontSize: 40px
    fontWeight: "600"
    lineHeight: 48px
  display-hero-mobile:
    fontFamily: Inter
    fontSize: 30px
    fontWeight: "600"
    lineHeight: 38px
  headline-lg:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: "600"
    lineHeight: 32px
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: "600"
    lineHeight: 28px
  headline-sm:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: "600"
    lineHeight: 24px
  body-lg:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: "400"
    lineHeight: 22px
  body-md:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: "400"
    lineHeight: 18px
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: "400"
    lineHeight: 16px
  mono-kpi-lg:
    fontFamily: JetBrains Mono
    fontSize: 28px
    fontWeight: "600"
    lineHeight: 34px
  mono-kpi-md:
    fontFamily: JetBrains Mono
    fontSize: 20px
    fontWeight: "500"
    lineHeight: 26px
  mono-data-table:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: "400"
    lineHeight: 16px
  mono-badge:
    fontFamily: JetBrains Mono
    fontSize: 11px
    fontWeight: "500"
    lineHeight: 14px
  label-caps:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: "600"
    lineHeight: 14px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-lg: 1.25rem
  margin: 1.5rem
  margin-mobile: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-lg: 1.25rem
  space-xl: 1.75rem
---

## Brand & Style

This design system embodies high-velocity operational command and executive precision. Engineered for enterprise leadership, quantitative analysts, and system operators, the aesthetic synthesizes the focused utility of developer platforms like Linear and Raycast with the refined polish of Stripe.

### Core Tenets

- **Obsidian Density & Clarity:** High information density without visual noise. Data stands unhindered against deep carbon backdrops.
- **Micro-Engineered Craft:** Hairline dividers, subtle inner glow reflections, and crisp typographic hierarchy signal elite engineering quality.
- **Tactile Fluidity:** Every state transition feels immediate, crisp, and predictable, invoking confidence during critical operational monitoring.

### Visual Aesthetic

Minimalist Modern with Glassmorphic Precision. Surfaces are structured in layered dark carbon tiers accented by razor-thin borders, subtle backdrop blur filters, and vibrant luminescence reserved strictly for status updates, actionable data paths, and vital enterprise metrics.

## Colors

The color architecture is built around an uncompromising dark carbon baseline, engineered with an inverted crisp slate counterpart for light mode.

### Dark Mode Palette (Default)

- **Base Canvas (`#09090b`):** Deep zinc/carbon canvas minimizing eye strain while emphasizing illuminated metrics.
- **Card Surface (`#121215`):** Elevated container layer providing soft separation from the primary background.
- **Interactive Surface / Hover (`#18181b`):** Dynamic feedback color for table rows, clickable list items, and active states.
- **Hairline Border (`rgba(255, 255, 255, 0.08)`): Crisp 1px structural framing.
- **Primary Accent (`#6366f1`):** Electric Indigo for key actions, primary interactive selections, and focal analytics points.
- **Secondary / Metric Health (`#10b981`):** Vivid Emerald designating positive momentum, live operational health, and fiscal gains.
- **Warning / Alert (`#f59e0b` & `#ef4444`):** Controlled amber and crimson hues utilized sparingly for anomalies and operational bottlenecks.

### Light Mode Contrast Tier

- **Canvas Base (`#f8fafc`):** Crisp alabaster slate foundation.
- **Elevated Card (`#ffffff`):** Pure white container surfaces framed with `rgba(0, 0, 0, 0.08)` borders and soft micro-drop shadows.
- **Interactive / Hover (`#f1f5f9`):** Subtle neutral tint for tactile feedback.

## Typography

Typography establishes an intentional distinction between human interface navigation and raw computational telemetry.

### Font Pairing Strategy

- **Inter:** Drives all navigational labels, structural section headers, and prose content. Its neutral, engineered curves ensure uncompromised legibility across complex multi-panel dashboard layouts.
- **JetBrains Mono:** Dedicated to numeric KPIs, telemetry status, financial values, dates, and tabular tables. Must always be styled with `font-feature-settings: "tnum" on, "zero" on` to guarantee rigid vertical alignment across rapidly recalculating rows.

### Header Casing & Metric Weighting

Category eyebrows and sidebar sub-group titles utilize `label-caps` in uppercase with letter spacing of `+0.06em`. Numeric metric headers prioritize bold weights (`600`) to let users scan large bento dashboards effortlessly.

## Layout & Spacing

The layout model is driven by an asymmetric Bento-box modular grid. Information is organized in high-utility spatial modules designed to maximize screen real estate and prioritize cognitive throughput.

### Grid & Layout Rules

- **Desktop (1280px+):** Fixed 240px or 280px left navigation sidebar paired with a 12-column fluid grid canvas using `1.25rem` (`20px`) gutters. Bento blocks span flexible units (e.g., 3-col KPI cards, 8-col chart modules, 4-col real-time transaction ledgers).
- **Tablet (768px - 1279px):** Sidebar collapses to an icon rail (64px) or slide-over drawer. Bento grid shifts to an 8-column layout with `1rem` gutters.
- **Mobile (<768px):** Single-column stacked stream with `margin-mobile` of `1rem`. Secondary telemetry panes wrap cleanly under main metric aggregates.

### Internal Spacing Rhythm

Component interiors rely on compact vertical and horizontal padding (`space-md` for standard cards, `space-lg` for primary visual charts) to sustain enterprise information density without visual crowding.

## Elevation & Depth

Visual hierarchy does not rely on heavy drop shadows. Instead, depth is constructed via **Tonal Stratification**, **Frosted Glass**, and **Hairline Stroke Definition**.

### Surface Hierarchy

1. **Level 0 (Canvas):** `#09090b` flat background.
2. **Level 1 (Bento Tile):** Background `#121215` with a 1px solid `rgba(255, 255, 255, 0.08)` outline. Subdued ambient glow under hovered surfaces (`0 8px 24px -4px rgba(0, 0, 0, 0.6)`).
3. **Level 2 (Popovers, Command Palette & Menus):** Semi-transparent `#18181b` with `backdrop-filter: blur(16px)` and an elevated perimeter border of `rgba(255, 255, 255, 0.14)`.
4. **Level 3 (Modal Dialogs):** `#18181b` positioned above a `rgba(0, 0, 0, 0.75)` backdrop blur overlay (`blur(8px)`), bounded by `0 20px 32px -8px rgba(0, 0, 0, 0.8)`.

### Inner Stroke Reflections

Cards feature an optional top-edge specular highlight: `box-shadow: inset 0 1px 0 0 rgba(255, 255, 255, 0.06)`. This mimics hardware-milled precision edges seen in top-tier executive tools.

## Shapes

The design system maintains a refined, technical geometry. Soft corner radii (`0.375rem` to `0.5rem`) are used consistently across cards and controls to maintain an authoritative, developer-grade feel.

### Corner Radii Guidelines

- **Base Components (Inputs, Buttons, Dropdowns):** `rounded` (`0.25rem` to `0.375rem`) for a precise, engineered profile.
- **Bento Modules & Containers:** `rounded-lg` (`0.5rem`) to frame large content groups cleanly.
- **Status Pills, Tags, & Badges:** Full pill radius (`9999px`) to create an immediate visual contrast against structural rectangular containers.

## Components

### Buttons

- **Primary:** Background `#6366f1`, text `#ffffff`, font Inter weight 500. Box shadow: `inset 0 1px 0 rgba(255,255,255,0.2), 0 2px 4px rgba(99,102,241,0.3)`. Hover: `#4f46e5`.
- **Secondary / Ghost:** Transparent background with 1px border `rgba(255, 255, 255, 0.12)`, text `#e4e4e7`. Hover: Background `#18181b`.
- **Icon Utility:** Square aspect ratio (`32x32px` or `36x36px`), centered vector glyph, 1px border `rgba(255,255,255,0.08)`, subtle hover brightness shift.

### Bento Analytics Cards

- Formed by a container of `#121215`, wrapped in a 1px border `rgba(255, 255, 255, 0.08)`.
- Internal layout: Top row with metric title in uppercase (`label-caps`), subtle sparkline or context indicator, followed by large tabular KPI readout (`mono-kpi-lg`). Bottom section highlights delta pill (`+14%` in Emerald with green low-opacity background).

### Badges & Status Indicators

- **Operational Status Pills:** JetBrains Mono font (`mono-badge`), padding `2px 8px`, border-radius `9999px`.
- **Healthy / Live:** Text `#10b981`, background `rgba(16, 185, 129, 0.12)`, border `1px solid rgba(16, 185, 129, 0.25)`. A 6px pulsing dot anchors the left edge.
- **Neutral / Informational:** Text `#a1a1aa`, background `rgba(255, 255, 255, 0.05)`, border `1px solid rgba(255, 255, 255, 0.08)`.

### Data Tables & Transaction Ledgers

- Striped or bordered rows using `1px solid rgba(255, 255, 255, 0.04)`.
- Numeric data columns right-aligned with JetBrains Mono numbers.
- Hover state: Entire row transitions to `#18181b` in 120ms linear ease.

### Form Inputs & Filters

- Background `#09090b` inset into the card surface, border 1px solid `rgba(255, 255, 255, 0.1)`. Focus state applies a crisp ring: `box-shadow: 0 0 0 1px #6366f1`. Placeholder text styled in muted zinc `#71717a`.

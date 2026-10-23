# Product Specification & Application Brief

## 1. Core User Job-to-be-Done

### Primary Persona
Executive operators, engineering managers, and technical founders operating a real-time SaaS platform.

### Core JTBD Statement
> "When monitoring operational health, revenue velocity, and system workloads across our services, I want an authoritative, high-density dashboard that presents mission-critical metrics and event telemetry without visual noise, so that I can rapidly diagnose anomalies, identify performance bottlenecks, and execute decisive remediations from any device."

### Key Objectives
- **Instant Scanability:** Spot live metric anomalies, transaction failures, or latency spikes in under 3 seconds.
- **Actionable Telemetry:** Inspect detailed tabular transaction ledgers and system services with immediate status filtering.
- **Device Agility:** Maintain 100% operational command on desktop (1440px), tablet (768px), and mobile (375px) without horizontal overflow or clipped controls.

---

## 2. Screen Inventory

The application is structured into the following operational views:

### Screen 1: Executive Overview (`/` or `/dashboard`)
- **Header:** Global title, workspace selector, live sync status indicator, time-range filter (1h, 24h, 7d, 30d), and primary quick-action trigger.
- **Bento KPI Matrix:**
  - *Active Workloads:* Current active jobs, percentage change vs previous period.
  - *System Latency (p99):* Tabular millisecond readout with delta status pill.
  - *API Throughput:* Requests per minute with healthy status badge.
  - *Error Rate:* Percentage calculation with warning/danger indicators when exceeding threshold.
- **Activity & Throughput Visualization:** Bento chart module displaying time-series telemetry.
- **Recent Incident & Transaction Ledger:** Data table with timestamp, event ID, service name, status indicator, and latency metrics.

### Screen 2: System Health & Services (`/services`)
- **Service Mesh Grid:** Status cards for internal microservices, database clusters, cache layers, and third-party integrations.
- **Node Resource Allocation:** CPU/Memory utilization bars, restart count, and uptime stats.

### Screen 3: Transaction Telemetry & Logs (`/transactions`)
- **Filter Toolbar:** Search by transaction ID, filter by status (Success, Pending, Failed), date range picker, and CSV export.
- **High-Density Table:** Sortable columns, right-aligned monetary/latency numeric values, expandable row details.

### Screen 4: Operational Settings & Keys (`/settings`)
- **API Key Management:** Key prefix, creation date, permissions, and revocation action.
- **Webhook Subscriptions:** Target URL, event filters, test payload trigger.

---

## 3. Component States

Every component and dashboard view must implement explicit, dedicated UI renderings for each of the four standard lifecycle states:

### A. Empty State
- **Trigger:** View or filtered table has zero records (e.g. freshly created workspace, no matching search results).
- **Presentation:**
  - Slate canvas container with hairline `#E2E8F0` border.
  - Centered subtle iconography (feather/lucide outline, no cartoonish illustrations).
  - Clear heading in Inter 16px (`#0F172A`) and supporting copy in Inter 14px (`#475569`).
  - Single primary action button (e.g., "Add Service", "Clear Filters", "Generate API Key") in `#0F172A` or `#2563EB`.

### B. Loading Skeleton State
- **Trigger:** Initial page load, route transition, or query recalculation.
- **Presentation:**
  - High-fidelity layout mirroring: skeleton blocks must match the exact dimensions, grid layout, and aspect ratio of populated cards to prevent Layout Shift (CLS).
  - Pulse animation: smooth pulse between `#F1F5F9` and `#E2E8F0` on white card surfaces.
  - Tabular rows: rendered with 5 simulated placeholder rows with varied block widths (60%, 40%, 80%).

### C. Populated State
- **Trigger:** Data loaded successfully with valid records.
- **Presentation:**
  - High data density layout with strict typographic hierarchy.
  - Tabular figures rendered with JetBrains Mono (`font-feature-settings: "tnum" on`).
  - Metric delta pills (Emerald `#059669` for positive, Slate `#475569` for neutral, Crimson `#DC2626` for negative).
  - Interactive row hover feedback (`#F8FAFC` transition).

### D. Error Banner State
- **Trigger:** Network failure, API 500 status, unauthorized session, or validation rejection.
- **Presentation:**
  - Banner container with subtle crimson background tint (`rgba(220, 38, 38, 0.06)`), 1px solid `#DC2626` border, and `rounded.md` (8px).
  - Prominent alert icon with error title in Inter 14px font-semibold (`#DC2626`).
  - Actionable resolution path: "Retry Connection" button, diagnostic error code in JetBrains Mono, and fallback cached data toggle if available.
  - Non-blocking layout: Banner anchors cleanly at the top of the content pane without unmounting or shattering the dashboard grid.

---

## 4. Breakpoint Constraints & Responsive Rules

All screens must strictly conform to three primary target viewports:

| Device Tier | Viewport Dimensions | Layout Grid | Navigation Behavior | Horizontal Scroll Policy |
|---|---|---|---|---|
| **Desktop** | `1440 x 900` | 12-Column Grid (Gutters: 24px) | Persistent Left Sidebar (240px) | Zero scroll outside designated data table containers |
| **Tablet** | `768 x 1024` | 8-Column Grid / 2-Column Bento | Collapsible Drawer or 64px Icon Rail | **Zero horizontal scroll (`scrollWidth <= clientWidth`)** |
| **Mobile** | `375 x 812` | Single Column Stack (Gutters: 16px) | Hidden Drawer with persistent Hamburger Header | **Zero horizontal scroll (`scrollWidth <= clientWidth`)** |

### Critical Layout Guardrails
1. **Drawer Below 768px:** The permanent desktop sidebar must never be rendered on screens narrower than 768px. It must fold into an off-canvas drawer accessed via a hamburger toggle.
2. **Table Horizontal Containment:** Wide data tables that exceed mobile screen width must wrap in an explicit `overflow-x-auto` wrapper with smooth touch scrolling and subtle boundary shadows. They must never expand the `<html>` or `<body>` element width.
3. **No Unstyled Card Overflow:** Long text strings, URLs, and hashes must use CSS truncation (`truncate`) or word breaking (`break-words`). Cards must enforce `overflow: hidden` or manage internal scroll boundaries cleanly.
4. **Touch Target Accessibility:** All buttons, dropdowns, and drawer menu items must maintain a minimum touch target size of 44x44px on mobile viewports.

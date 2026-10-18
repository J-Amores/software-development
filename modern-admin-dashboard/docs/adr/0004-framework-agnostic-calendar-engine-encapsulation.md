# 0004. Framework-Agnostic Calendar Engine Encapsulation in Deep Custom Module

- **Status**: accepted
- **Date**: 2026-10-17

## Context

The legacy admin dashboard relied on `@fullcalendar/react` tightly coupled with Material UI and React runtime component hierarchies. In Phase 3, we require an interactive, accessible calendar interface supporting month, week, day, and list views, date-range selection, and event deletion. Using `@fullcalendar/react` would violate our zero-client-side-framework architecture (ADR 0001), while building a multi-view interactive calendar engine entirely from scratch would introduce unnecessary maintenance overhead and risk time calculation regressions.

## Decision

We will install and encapsulate framework-agnostic FullCalendar vanilla packages (`@fullcalendar/core`, `@fullcalendar/daygrid`, `@fullcalendar/timegrid`, `@fullcalendar/list`, `@fullcalendar/interaction`) inside a single deep module (`web/src/components/calendar/`) exposing a minimal DOM lifecycle interface (`mount(container, options)`, `update({ events })`, `unmount()`):
- **Encapsulation Seam**: Neither view modules (such as `CalendarView`) nor test suites may import `@fullcalendar/*` directly. All FullCalendar options, plugins, event listeners, and DOM bindings are managed internally by the deep module.
- **Styling Integration**: FullCalendar's internal CSS custom properties are mapped directly to our semantic CSS custom properties in `tokens.css` (`--bg-card`, `--border-color`, `--text-primary`, `--color-primary`, `--color-accent`) to seamlessly support instant dark and light theme switching.
- **Test Ergonomics & Headless Fallback**: The deep module provides a safe headless fallback when running under headless DOM testing environments (`happy-dom` in Vitest) that lack full layout/bounding rect support, ensuring sub-second automated unit tests without complex mock rigging.

## Consequences

- **Zero React Overhead**: The application retains standard web technologies with zero React or component framework bundle overhead shipped to the client.
- **Protected Seam**: If the underlying calendar engine is replaced or upgraded in the future, only the deep module wrapper requires changes; view consumers and unit tests remain isolated and unaffected.
- **Headless Test Reliability**: View and component unit tests verify business logic, API communication, and observable DOM interactions cleanly.

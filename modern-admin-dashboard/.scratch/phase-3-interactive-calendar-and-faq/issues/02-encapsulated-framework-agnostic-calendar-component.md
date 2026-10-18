# 02: Encapsulated Framework-Agnostic Calendar Component

**What to build:** An encapsulated, framework-agnostic calendar engine component following the deep module pattern (ADR 0004). Installs vanilla FullCalendar packages (`@fullcalendar/core`, `@fullcalendar/daygrid`, `@fullcalendar/timegrid`, `@fullcalendar/list`, `@fullcalendar/interaction`) with zero React dependencies; encapsulates all calendar instantiation and event hooks behind a minimal DOM lifecycle interface (`mount(container, options)`, `update({ events })`, `unmount()`) so callers and tests never import `@fullcalendar/*` directly; maps FullCalendar CSS variables directly to our semantic CSS design tokens in `tokens.css` for instant dark/light theme switching; and provides a robust headless DOM fallback enabling sub-second unit test execution in `happy-dom`.

**Blocked by:** None (can start immediately)

**Status:** resolved

- [x] Framework-agnostic vanilla FullCalendar packages (`@fullcalendar/core`, `@fullcalendar/daygrid`, `@fullcalendar/timegrid`, `@fullcalendar/list`, `@fullcalendar/interaction`) are installed in the web workspace with zero React dependencies
- [x] Calendar deep module is implemented at `web/src/components/calendar/` exposing `mount(container, options)`, `update({ events })`, and `unmount()`
- [x] FullCalendar imports and instances are completely private to the component; external views and tests never import `@fullcalendar/*`
- [x] FullCalendar CSS custom properties are mapped to design tokens (`--bg-card`, `--border-color`, `--text-primary`, `--color-primary`, `--color-accent`) supporting both dark and light modes
- [x] Component dispatches clean external callbacks for date range selection (`onSelect`) and event interaction (`onEventClick`)
- [x] Headless DOM testing fallback provides a structured DOM representation when running in headless environments (`happy-dom`) lacking layout metrics
- [x] Automated unit tests in Vitest verify mounting, event updating, callback invocation on simulated interactions, and clean DOM unmounting

## Comments

### Implementation Summary
- **Dependencies (`web/package.json`)**: Installed framework-agnostic FullCalendar v6 packages (`@fullcalendar/core`, `@fullcalendar/daygrid`, `@fullcalendar/timegrid`, `@fullcalendar/list`, `@fullcalendar/interaction`) with zero React wrapper overhead.
- **Deep Component (`web/src/components/calendar/index.js`)**: Encapsulated FullCalendar inside `CalendarComponent` behind standard DOM lifecycle methods (`mount`, `update`, `unmount`), completely isolating all `@fullcalendar/*` imports. Built a structured headless DOM fallback that renders toolbar controls, event items, and date selection triggers for headless test environments (`happy-dom`).
- **Design Tokens & Theme Styling (`web/src/styles/calendar.css`, `main.css`)**: Mapped FullCalendar's CSS custom properties (`--fc-page-bg-color`, `--fc-border-color`, `--fc-button-*`, `--fc-event-*`, `--fc-today-bg-color`) to application design tokens in `tokens.css` for instant dark/light mode switching.
- **Verification (`web/test/calendar-component.test.js`)**: Created 10 automated unit tests verifying lifecycle mounting/unmounting, FullCalendar engine initialization, dynamic event updates, callback dispatches (`onSelect`, `onEventClick`), and headless fallback mode. All 16 test files (147 tests) passing in under 1 second; 0 warnings or lint errors via `vp check`.

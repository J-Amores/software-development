# Specification: Phase 3 — Interactive Calendar & FAQ Modules

**Status**: ready-for-agent

## Problem Statement

Operators and administrators currently navigate placeholder views for both the interactive organizational calendar (`/calendar`) and administrative frequently asked questions (`/faq`). The legacy dashboard relied heavily on React wrappers (`@fullcalendar/react`), Material UI modal dialogs, and non-standard browser prompts (`window.prompt`, `window.confirm`) to manipulate mock in-memory calendar state, while the legacy FAQ view rendered static, non-interactive lorem ipsum text. The application lacks a persistent database layer for scheduling events and curated organizational knowledge, lacks REST APIs with schema validation, lacks accessible zero-framework dialogs and accordion controls, and lacks framework-agnostic calendar encapsulation that adheres to our zero-runtime-framework architecture and CSS custom property design tokens.

## Solution

Deliver the complete interactive Calendar scheduling and FAQ knowledge modules using standard web technologies, the native MongoDB driver, and Fastify:
1. Extend the MongoDB Atlas persistence layer with dedicated `events` and `faqs` collections, seeded idempotently using `bulkWrite` upserts and unique integer business identifiers (`id`).
2. Integrate the atomic sequence generator (`counters` collection) to allocate collision-free sequential integer IDs for newly scheduled Calendar Events.
3. Expose REST endpoints under `/api/v1/` with Fastify JSON Schema validation for managing Calendar Events (`GET /api/v1/events`, `POST /api/v1/events`, `DELETE /api/v1/events/:id`) and querying curated FAQ Entries (`GET /api/v1/faqs`).
4. Encapsulate framework-agnostic FullCalendar vanilla packages (`@fullcalendar/core`, `@fullcalendar/daygrid`, `@fullcalendar/timegrid`, `@fullcalendar/list`, `@fullcalendar/interaction`) inside a deep custom component behind standard DOM lifecycle methods (`mount`, `update`, `unmount`), mapped directly to CSS theme tokens.
5. Implement the `/calendar` view pairing the encapsulated calendar engine with an Upcoming Events Sidebar, native HTML `<dialog>` modals with HTML5 Constraint Validation for event creation, and confirmation `<dialog>` modals for deletion.
6. Implement the `/faq` view utilizing semantic HTML `<details>` and `<summary>` accordions, a live search text filter that auto-expands matching items, and an "Expand All / Collapse All" toggle.
7. Extend the injectable `ApiClient` and in-memory fake client seams, verifying all backend routes via Fastify `.inject()` and frontend views via Vitest (`vp test`) with zero new testing seams.

## User Stories

1. As an Operator, I want the system database to idempotently seed initial Calendar Event and FAQ Entry documents, so that development and deployment environments can be initialized reliably without creating duplicate records.
2. As an Operator, I want Calendar Event and FAQ Entry documents to utilize sequential integer IDs (`id: 1, 2, ...`), so that API URLs and client references remain human-readable and consistent with our existing schema.
3. As an Operator, I want sequential integer IDs for newly scheduled Calendar Events to be allocated atomically via the counters collection, so that concurrent scheduling requests never produce duplicate identifiers.
4. As an Operator, I want the seeded FAQ entries to contain realistic, domain-accurate operational guidance (addressing Operator Access Levels, Invoice billing cycles, Calendar milestone scheduling, and Contact privacy compliance) rather than generic lorem ipsum text, so that the FAQ provides genuine organizational utility.
5. As an Operator, I want to view a full interactive calendar on `/calendar` supporting Month, Week, Day, and List views, so that I can inspect organizational commitments across different planning horizons.
6. As an Operator, I want to navigate between calendar time horizons using Today, Previous, and Next toolbar controls, so that I can explore past schedules and upcoming milestones seamlessly.
7. As an Operator, I want the calendar's visual styles (cell backgrounds, border lines, event chips, and typography) to match our application design tokens and adapt instantly to dark and light theme toggling, so that the calendar looks cohesive with the rest of the dashboard.
8. As an Operator, I want to see a left-hand Upcoming Events Sidebar alongside the calendar grid, so that I can review upcoming appointments in chronological order at a glance.
9. As an Operator, I want to select a date or date range on the calendar grid, or click an "Add Event" button, to open a native HTML `<dialog>` modal, so that I can schedule a new Calendar Event without leaving the page.
10. As an Operator, I want the event creation modal to require an event title and start date using native HTML5 Constraint Validation, so that invalid or empty submissions are prevented before network transmission.
11. As an Operator, I want the event creation modal to support an all-day checkbox and an optional end date, so that both single-day milestones and multi-day operational windows can be scheduled accurately.
12. As an Operator, I want the event creation modal to support closing via a Cancel button, the top-right dismiss control, or the Escape key, so that keyboard navigation and accessible modal behavior are preserved.
13. As an Operator, I want newly created Calendar Events to immediately appear on both the calendar grid and the Upcoming Events Sidebar, so that the UI reflects the updated schedule without requiring a full page refresh.
14. As an Operator, I want to click an existing event chip on the calendar grid to open a native HTML `<dialog>` confirmation modal, so that I am prompted before permanently removing a scheduled event.
15. As an Operator, I want to click an event card in the Upcoming Events Sidebar to open the same deletion confirmation modal, so that event management is consistent across both representations.
16. As an Operator, I want the deletion confirmation modal to display the event title and date range, so that I can verify the exact event being purged from the schedule.
17. As an Operator, I want confirming deletion to remove the event from the database and immediately remove it from both the calendar grid and the sidebar, so that the active schedule stays in sync.
18. As an Operator, I want to navigate to `/faq` and view a collection of curated organizational questions and answers rendered as semantic `<details>` and `<summary>` accordions, so that I can review institutional procedures.
19. As an Operator, I want to filter FAQ entries in real time by typing into a search input, so that I can quickly locate answers to specific procedural questions.
20. As an Operator, I want search filtering on `/faq` to match queries against both question titles and answer bodies, so that relevant answers are discovered even if the query matches text within the explanation.
21. As an Operator, I want matching FAQ accordions to automatically expand (`open = true`) when searching, so that matching answers are instantly visible without requiring manual clicks on every item.
22. As an Operator, I want an "Expand All / Collapse All" toggle button on `/faq`, so that I can expand all visible accordions for rapid scanning or collapse them for a compact overview.
23. As an Operator, I want to see a helpful empty state when a search query matches no FAQ entries, so that I know why no accordions are displayed.
24. As an Operator, I want all frontend views to communicate with the backend exclusively through an injectable API client adapter seam, so that components can be thoroughly verified in sub-second offline automated tests.

## Implementation Decisions

### Domain & Business Model Alignment
- **Glossary Alignment**: The business vocabulary strictly follows [GLOSSARY.md](file:///Users/jamores/Documents/[02]%20Work/[01]%20Github-Repo/software-development/modern-admin-dashboard/GLOSSARY.md). Scheduled operational milestones are **Calendar Events**, curated administrative questions and answers are **FAQ Entries**, authorized system users are **Operators**, and internal staff and access tiers are **Team Members** with assigned **Access Levels**.
- **Canonical Event Structure**: In MongoDB documents and API payloads, Calendar Events standardize on the canonical properties `{ id, title, start, end, allDay }`. Here `start` and `end` are ISO-8601 strings or `YYYY-MM-DD` strings, mapping directly to standard calendar representations without intermediate transformations.
- **Canonical FAQ Structure**: In MongoDB documents and API payloads, FAQ Entries standardize on `{ id, question, answer, category }`.

### Database Architecture & Idempotent Seeding
- **Collections**: MongoDB storage is partitioned with dedicated `events` and `faqs` collections alongside existing collections (`members`, `contacts`, `invoices`, `transactions`, `metrics`, `counters`).
- **Unique Indexes**: Ensure unique indexing on `id` across both `events` (`idx_events_id_unique`) and `faqs` (`idx_faqs_id_unique`) in the index management module.
- **Atomic Counters**: Newly provisioned Calendar Events allocate sequential integer IDs via `counters` using `findOneAndUpdate({ _id: "events" }, { $inc: { seq: 1 } }, { returnDocument: "after", upsert: true })`.
- **Idempotent Seeder**: The database seeder script builds unique indexes before executing `bulkWrite` upserts (`updateOne({ id }, { $set: doc }, { upsert: true })`) for initial Calendar Events and domain-accurate FAQ Entries. The counter floor for `events` is set to the maximum existing seed ID.

### Backend Fastify REST API
- **Endpoint Structure**:
  - `GET /api/v1/events`: Fetch all scheduled Calendar Events, sorted chronologically by start date.
  - `POST /api/v1/events`: Provision a new Calendar Event with JSON Schema validation (`title`, `start`, optional `end`, `allDay`). Returns 201 Created with the newly allocated integer `id`.
  - `DELETE /api/v1/events/:id`: Remove an existing Calendar Event by integer ID. Returns 200 OK or 404 Not Found.
  - `GET /api/v1/faqs`: Fetch all curated FAQ Entries with optional search filtering (`?q=`).
- **Validation**: Enforce Fastify native JSON Schema validation on all parameters, request bodies, and query strings, automatically rejecting malformed requests with RFC-compliant 400 Bad Request responses.
- **Database Adapter Injection**: Route plugins access database collections via the injected database adapter instance, enabling fully in-memory testing with Fastify `app.inject()`.

### Frontend Deep Modules & View Architecture
- **Calendar Engine Encapsulation ([ADR 0004](file:///Users/jamores/Documents/[02]%20Work/[01]%20Github-Repo/software-development/modern-admin-dashboard/docs/adr/0004-framework-agnostic-calendar-engine-encapsulation.md))**:
  - Encapsulate vanilla FullCalendar packages (`@fullcalendar/core`, `@fullcalendar/daygrid`, `@fullcalendar/timegrid`, `@fullcalendar/list`, `@fullcalendar/interaction`) inside a deep module at `web/src/components/calendar/`.
  - The public interface of the calendar component is strictly limited to lifecycle methods: `mount(container, options)`, `update({ events })`, and `unmount()`.
  - Callers and tests must never import `@fullcalendar/*` directly.
  - FullCalendar internal CSS variables are mapped to design tokens in `web/src/styles/tokens.css` (`--bg-card`, `--border-color`, `--text-primary`, `--color-primary`, `--color-accent`) to provide seamless light and dark mode integration.
  - The component detects headless testing environments lacking layout/bounding box metrics (`happy-dom`) and provides a safe fallback DOM structure so unit tests execute cleanly without canvas errors.
- **Calendar View (`/calendar`)**:
  - Renders a two-column responsive operational layout: a 300px Upcoming Events Sidebar on the left and the main interactive calendar grid on the right.
  - Sidebar renders upcoming events in chronological order, with formatted date badges and delete action buttons.
  - Event creation modal is implemented via a native HTML `<dialog>` element containing a `<form method="dialog">` using HTML5 Constraint Validation (`title`, `startDate`, `endDate`, `allDay`).
  - Event deletion modal is implemented via a native HTML `<dialog>` element providing explicit confirmation with "Delete Event" and "Cancel" actions.
- **FAQ View (`/faq`)**:
  - Built with zero runtime frameworks using native HTML `<details>` and `<summary>` elements.
  - Includes a prominent header, an operational search text input, and an "Expand All / Collapse All" toggle button.
  - Live input filtering dynamically evaluates questions and answers, hiding non-matching elements and auto-expanding matching items (`open = true`).
  - Displays a clean empty-state message when zero questions match the active query.
- **API Client Adapter Extension**:
  - Extend `createApiClient` with `getEvents()`, `createEvent(data)`, `deleteEvent(id)`, and `getFaqs(params)`.
  - Extend `createFakeApiClient` with stateful in-memory stores for events and FAQs to power offline view tests.

## Testing Decisions

- **Good Test Criteria**: Tests must verify observable external behavior and contracts across seams, never private variables, internal helper routines, or implementation details of third-party dependencies.
- **Backend API Seam Testing**: Tested via Fastify `app.inject()` without network port binding. Tests verify status codes, JSON schema rejection for malformed payloads, chronological sorting, sequential integer ID allocation, and deletion behavior.
- **Database Seeder & Index Testing**: Tested via database adapter calls verifying index creation, idempotent repeat execution (verifying document counts do not double on rerun), and sequence counter accuracy.
- **Frontend Component & View Testing**: Tested with Vitest and `happy-dom` through the `createFakeApiClient` seam and the DOM view lifecycle seam (`mount`/`unmount`). Tests verify:
  - Calendar mounting and event rendering in both the grid container and Upcoming Events Sidebar.
  - Opening the native `<dialog>` creation modal on date selection or Add Event button click.
  - Submitting the creation form, triggering `createEvent`, and observing immediate UI synchronization.
  - Opening the native `<dialog>` deletion confirmation modal on event click and confirming deletion.
  - FAQ view accordion rendering, real-time query filtering, auto-expansion of search matches, and the "Expand All / Collapse All" toggle behavior.
- **Prior Art**: Follows existing patterns in `api/test/team.test.js`, `api/test/invoices.test.js`, `api/test/seed.test.js`, `web/test/team-view.test.js`, and `web/test/data-table.test.js`.

## Out of Scope

- Standalone analytical chart views (`/bar`, `/pie`, `/line`, `/geography`) and charting libraries (deferred to Phase 4).
- Full Dashboard analytics overview cards and transaction summary widgets on `/` (deferred to Phase 4).
- Recurring calendar event rules (RRULE) or external calendar sync (iCal/Google Calendar).
- WYSIWYG rich text editor for FAQ content editing (FAQ is currently an operator-facing read/query view).

## Further Notes

- All changes strictly preserve the zero-framework architecture: standard HTML5, native ES Modules, Light DOM Custom Elements, and native CSS Custom Properties.
- The FullCalendar installation uses framework-agnostic vanilla ESM packages (`@fullcalendar/*`) managed via `pnpm` in the web package workspace without any React dependencies.

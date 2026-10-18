# 04: Interactive Calendar View with Upcoming Events Sidebar & Native Dialog Modals

**What to build:** The complete operational `/calendar` view replacing the placeholder. Renders a responsive two-column layout featuring an Upcoming Events Sidebar on the left and the encapsulated interactive calendar grid on the right; supports Month, Week, Day, and List views with toolbar controls; provides a native HTML `<dialog>` creation modal with HTML5 Constraint Validation (`title`, `startDate`, `endDate`, `allDay`) triggered by date range selection or Add Event click; provides a native HTML `<dialog>` confirmation modal for event deletion triggered from both calendar chips and sidebar cards; synchronizes schedule state bidirectionally across both grid and sidebar upon event mutations without full-page reloads; and wires cleanly into the application router.

**Blocked by:** 02 (Encapsulated Framework-Agnostic Calendar Component), 03 (Calendar Events Backend API & Client Adapter Seam)

**Status:** resolved

- [x] `/calendar` route is wired in the router to mount `CalendarView` replacing the placeholder view
- [x] Responsive view layout pairs a 300px Upcoming Events Sidebar with the main calendar grid
- [x] Sidebar displays upcoming events in chronological order with formatted date badges and deletion trigger actions
- [x] Calendar grid renders scheduled events and supports Month, Week, Day, and List view switching and toolbar navigation (Today, Prev, Next)
- [x] Selecting a date or clicking Add Event opens a native HTML `<dialog>` modal with standard HTML5 Constraint Validation
- [x] Submitting the creation modal issues `createEvent` through the API client and immediately adds the event to both the calendar grid and the sidebar
- [x] Clicking an event chip on the grid or an event in the sidebar opens a native HTML `<dialog>` confirmation modal displaying the event details
- [x] Confirming deletion issues `deleteEvent` through the API client and immediately removes the event from both the calendar grid and the sidebar
- [x] Inline status and error banners provide accessible feedback upon successful or failed scheduling mutations
- [x] View cleanup (`unmount()`) cleanly removes DOM elements, closes active dialogs, and tears down event listeners
- [x] Automated tests in Vitest verify initial data rendering, creation modal validation, deletion confirmation, and bidirectional synchronization

## Resolution Comments
- Created `CalendarView` in `web/src/views/calendar-view.js` with responsive upcoming events sidebar and encapsulated `CalendarComponent` integration.
- Wired `/calendar` route in `web/src/routes.js` replacing `PlaceholderView`.
- Added CSS layout and styling for two-column calendar scene, sidebar cards, delete triggers, and modal dialogs in `web/src/styles/calendar.css`.
- Replaced `window.prompt`/`window.confirm` with native HTML `<dialog>` modals with constraint validation and accessible ARIA attributes.
- Authored 18 unit tests in `web/test/calendar-view.test.js` validating lifecycle, creation flow, date selection, deletion flow, error banners, and unmount cleanup.
- Ran `pnpm check --fix` and `pnpm test` (18 test files, 182 tests passing, 0 lint errors).

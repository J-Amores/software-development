# 03: Calendar Events Backend API & Client Adapter Seam

**What to build:** The backend REST API endpoints and frontend client adapter methods for managing Calendar Events. Implements Fastify routes `GET /api/v1/events` (returning chronologically sorted events), `POST /api/v1/events` (allocating sequential integer IDs via atomic counters and validating required title, start, optional end, and all-day indicators via JSON Schema), and `DELETE /api/v1/events/:id` (removing scheduled events by integer ID); verifies all endpoints in-memory using Fastify `app.inject()`; and extends both `createApiClient` and `createFakeApiClient` with `getEvents()`, `createEvent(data)`, and `deleteEvent(id)` methods for offline frontend testing.

**Blocked by:** 01 (Database Indexes, Counters, and Idempotent Seeding for Calendar Events & FAQ Entries)

**Status:** resolved

- [x] `GET /api/v1/events` endpoint returns all stored Calendar Events sorted chronologically by start date, projecting `id` over MongoDB `_id`
- [x] `POST /api/v1/events` endpoint enforces JSON Schema validation on `title`, `start`, `end`, and `allDay`, returning 400 Bad Request on malformed inputs
- [x] `POST /api/v1/events` allocates sequential integer IDs atomically via the `counters` collection and returns 201 Created with the created event document
- [x] `DELETE /api/v1/events/:id` removes the event matching the integer ID, returning 200 OK with confirmation or 404 Not Found if missing
- [x] Fastify routes are registered in the application builder and access MongoDB collections through the injected database adapter
- [x] `createApiClient` network adapter implements `getEvents()`, `createEvent(data)`, and `deleteEvent(id)`
- [x] `createFakeApiClient` in-memory test fake mirrors all three methods with stateful event storage for offline component tests
- [x] Automated tests verify Fastify endpoint validation, chronological ordering, atomic sequence generation, and client adapter operations

## Comments

### Implementation Summary
- **Backend API Routes (`api/src/routes/events.js`, `api/src/app.js`)**: Implemented Fastify plugin providing `GET /api/v1/events` (chronological sorting by default, `_id` projected out), `POST /api/v1/events` (atomic sequential ID generation via `getNextSequence(rawDb, "events")`, schema validation for `title`, `start`, optional `end`, `allDay`), and `DELETE /api/v1/events/:id` (delete by integer ID with 404 if not found). Registered plugin in `createApp`.
- **Client Adapter Seam (`web/src/api/index.js`)**: Extended `createApiClient` with `getEvents(params)`, `createEvent(eventData)`, and `deleteEvent(id)`. Extended `createFakeApiClient` with in-memory stateful `eventsStore`, sorting, sequence generation, and deletion.
- **Automated Verification (`api/test/events.test.js`, `web/test/api-client.test.js`)**: Created 10 Fastify `.inject()` route tests covering querying, sorting, constraint rejection, atomic ID incrementation, and deletion. Added 7 unit tests in `api-client.test.js` verifying network client fetch formatting and in-memory fake client CRUD. Monorepo total: 17 test suites (164 tests) passing in 1.1s; 0 warnings or lint errors via `vp check`.

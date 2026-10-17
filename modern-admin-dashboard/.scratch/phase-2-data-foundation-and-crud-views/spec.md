# Specification: Phase 2 — MongoDB Atlas Data Foundation & Core Directory/Billing CRUD Views

**Status**: resolved

## Problem Statement

Administrators and operators currently have an application shell with placeholder views and no way to manage organizational personnel, external institutional contacts, or commercial invoices. The legacy administrative dashboard depended on bloated client-side runtime dependencies (React 18, Material UI, `@mui/x-data-grid`, and Formik/Yup) bound to static in-memory mock objects. The system lacks a persistent database layer, real backend mutation endpoints, idempotent database seeding, and accessible, zero-framework tabular data views that support search filtering, sorting, pagination, multi-row selection, and standard constraint-validated entity creation.

## Solution

Build out the full data foundation and operational directory/billing workflows using standard web technologies, the native MongoDB driver, and Fastify:
1. Seed and index MongoDB Atlas collections (`members`, `contacts`, `invoices`, `transactions`, `metrics`) idempotently using `bulkWrite` upserts and unique business identifiers (`id`, `txId`, `metricKey`).
2. Provide atomic sequence allocation via a dedicated `counters` collection to maintain collision-free sequential integer IDs for newly provisioned records.
3. Expose REST endpoints under `/api/v1/` with Fastify JSON Schema validation for managing Team Members, Contacts, and Invoices.
4. Replace the legacy DataGrid with a deep, zero-framework, semantic HTML `DataTable` module supporting column sorting, text search filtering, row checkbox selection, and pagination.
5. Implement the live `/team` (Manage Team), `/contacts` (Contacts Information), and `/invoices` (Invoices Balances) views wired to the backend through the frontend `ApiClient` adapter seam.
6. Replace Formik/Yup with a zero-dependency Team Member Provisioning form (`/form`) driven by native HTML5 Constraint Validation (`checkValidity()`, `FormData`), providing inline status feedback and directory navigation.

## User Stories

1. As an Operator, I want the system database to be idempotently seedable from the command line, so that development and deployment environments can be initialized repeatedly without creating duplicate records or orphaned state.
2. As an Operator, I want Team Member, Contact, and Invoice records to utilize clean sequential integer IDs, so that URLs and record references remain human-readable and predictable.
3. As an Operator, I want sequential integer IDs to be allocated atomically, so that concurrent creation requests never collide or produce duplicate keys.
4. As an Operator, I want all legacy chart metric datasets and financial transactions to be stored in the database, so that subsequent analytical features can query persistent data without schema migrations.
5. As an Operator, I want to view a paginated directory of Team Members under `/team`, so that I can inspect organizational personnel and their assigned Access Levels.
6. As an Operator, I want to filter the Team Members directory in real time by typing a query into a search field, so that I can immediately locate collaborators by name or email.
7. As an Operator, I want to sort the Team Members directory by clicking column headers (such as Name, Age, or Access Level), so that I can order collaborators logically.
8. As an Operator, I want to see color-coded visual badges indicating each Team Member's Access Level (Admin, Manager, User), so that organizational authority is instantly distinguishable.
9. As an Operator, I want to modify a Team Member's Access Level directly from the `/team` directory via an accessible control, so that administrative permissions can be updated without leaving the view.
10. As an Operator, I want invalid Access Level update requests to be rejected with descriptive error feedback, so that system security and role integrity are preserved.
11. As an Operator, I want to view an external directory of Contacts under `/contacts`, so that I can review client representatives, institutional partners, phone numbers, and addresses.
12. As an Operator, I want to filter and sort the Contacts directory across names, emails, and cities, so that I can navigate large contact directories quickly.
13. As an Operator, I want to view all accounts receivable and outstanding Invoice balances under `/invoices`, so that I can track commercial payment obligations.
14. As an Operator, I want invoice amounts to be stored and displayed as numeric values with standard currency formatting, so that balances reflect financial accuracy rather than raw strings.
15. As an Operator, I want to select one or multiple Invoices using row checkboxes, so that I can perform batch administrative operations.
16. As an Operator, I want to delete selected Invoices after confirmation, so that settled or erroneous payment requests can be purged from the active ledger.
17. As an Operator, I want to provision a new Team Member through an accessible form under `/form`, so that new internal collaborators can be onboarded into the organization.
18. As an Operator, I want the provisioning form to validate required inputs (full name, valid email format, contact phone, and valid Access Level) using native browser validation, so that malformed data is caught before network transmission.
19. As an Operator, I want to see clear, accessible inline validation error messages when required fields are missing or invalid, so that I can correct input mistakes immediately.
20. As an Operator, I want the provisioning form to display an accessible confirmation alert upon successful submission, so that I have positive verification that the record was created.
21. As an Operator, I want a direct action to navigate to the Team Member directory following successful member creation, so that I can verify the new collaborator in the active directory without manual URL navigation.
22. As an Operator, I want all frontend views to communicate with the backend exclusively through an injectable API client adapter seam, so that views can be comprehensively verified in sub-second offline automated tests.

## Implementation Decisions

### Domain & Business Model Decisions
- **Glossary Alignment**: The business language strictly adheres to the domain model: internal workers are **Team Members** with assigned **Access Levels** (`admin`, `manager`, `user`), external relationships are **Contacts**, payment requests are **Invoices** carrying a quantified **Amount**, and system administrators are **Operators**.
- **Amount over Cost**: The legacy `cost` attribute on invoices is normalized to `amount` (numeric float) and registered in the domain glossary under Commercial & Financial Operations.
- **Form Purpose**: The `/form` view is canonically defined as **Team Member Provisioning**, creating records in the `members` collection with explicit Access Level assignment.

### Database Architecture & Idempotent Seeding
- **Collections**: MongoDB collections are partitioned into `members`, `contacts`, `invoices`, `transactions`, `metrics`, and `counters`.
- **Primary Identifiers**: `members`, `contacts`, and `invoices` utilize a unique-indexed integer `id` field. MongoDB's native `_id` is omitted from API responses.
- **Atomic Counters**: An atomic sequence generator function updates the `counters` collection using `findOneAndUpdate` with `$inc: { seq: 1 }` and `returnDocument: "after"` to generate sequential integer keys.
- **Idempotent Seeder**: The database seeder script builds unique indexes on key fields before executing `bulkWrite` upsert operations (`updateOne({ id }, { $set: doc }, { upsert: true })`). Metric datasets (`mockBarData`, `mockPieData`, `mockLineData`, `mockGeographyData`) are partitioned into distinct documents identified by a unique `metricKey`. The `counters` collection is initialized to the maximum existing seed IDs.

### Backend Fastify REST API
- **Endpoint Structure**:
  - `GET /api/v1/team`: Query team members with optional search (`?q=`) and sorting (`?sort=&order=`).
  - `POST /api/v1/team`: Provision a team member with schema validation for `name`, `email`, `phone`, `age`, and `access`.
  - `PATCH /api/v1/team/:id`: Mutate access level or collaborator attributes with schema validation.
  - `GET /api/v1/contacts`: Query contacts with optional search and sorting.
  - `POST /api/v1/contacts`: Provision an external contact record.
  - `GET /api/v1/invoices`: Query invoices with optional search, sorting, and balance calculations.
  - `DELETE /api/v1/invoices/:id`: Remove an invoice by integer ID.
- **Validation**: Every route enforces native Fastify JSON Schema validation for request parameters, query strings, and request bodies, returning RFC-compliant 400 Bad Request responses automatically on constraint failure.
- **Database Injection**: Routes access the database through the decorated database adapter, allowing tests to run entirely in-memory using `app.inject()`.

### Frontend Deep Modules & View Architecture
- **API Client Seam**: The API client module encapsulates network communication behind explicit methods (`getTeamMembers`, `createTeamMember`, `updateTeamMemberAccess`, `getContacts`, `createContact`, `getInvoices`, `deleteInvoice`). The in-memory fake client mirrors this exact interface with stateful mock storage for offline component tests.
- **DataTable Component**: A deep, self-contained semantic HTML table module managing its own internal state (current sort column and direction, debounced text search across visible columns, pagination page and size, and row selection set). The public interface is strictly limited to four lifecycle methods: `mount(container)`, `update({ data })`, `getSelectedRows()`, and `unmount()`.
- **Directory & Billing Views**:
  - `/team`: Renders the `DataTable` with color-coded Access Level badges and an inline `<select>` control to update permissions on the fly.
  - `/contacts`: Renders the `DataTable` with full client and registrar contact data and live search.
  - `/invoices`: Renders the `DataTable` with row checkbox selection, toolbar batch deletion, and formatted currency amounts.
- **Form View (`/form`)**: Built with semantic HTML `<form novalidate>`, relying on native browser Constraint Validation (`checkValidity()`, `validity` properties), styled with CSS tokens, extracting values via `FormData`, and displaying inline confirmation alerts with direct navigation actions.

## Testing Decisions

- **Good Test Criteria**: Tests must verify observable external behavior and contracts across seams, never internal implementation details, private variables, or ephemeral DOM structure.
- **Backend API Seam Testing**: Tested via Fastify `app.inject()` without binding real network ports. Tests verify status codes, JSON schema rejection for malformed payloads, correct pagination/search filtering responses, and atomic sequence allocation.
- **Database Seeder & Adapter Seam Testing**: Tested by verifying index creation, idempotent repeated execution (ensuring document counts do not double on rerun), and sequence counter accuracy.
- **Frontend Component & View Testing**: Tested with Vitest and `happy-dom` through the `createFakeApiClient` seam and the DOM view lifecycle seam (`mount`/`unmount`). Tests verify table rendering, sorting interactions, search filtering updates, row selection toggles, Access Level inline mutations, and form validation error states.
- **Prior Art**: Follows existing test patterns in `api/test/health.test.js` and `web/test/dashboard-view.test.js`.

## Out of Scope

- Calendar scheduling view (`/calendar`) and interactive FullCalendar replacement (deferred to Phase 4).
- FAQ accordion view (`/faq`) and content management (deferred to Phase 4).
- Standalone analytical chart views (`/bar`, `/pie`, `/line`, `/geography`) and charting libraries (deferred to Phase 3).
- Full Dashboard analytics overview cards and transaction summary widgets on `/` (deferred to Phase 3).

## Further Notes

- All changes maintain the zero-framework architecture: standard HTML5, Light DOM Custom Elements, native CSS Custom Properties, and native ES Modules.
- The database connection pool and seeding script work identically against local Docker MongoDB (`mongodb://localhost:27017/admin_dashboard`) and MongoDB Atlas via `MONGODB_URI`.

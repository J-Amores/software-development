# 06: Invoices Balances Directory & Deletion Flow (/invoices)

**What to build:** A commercial billing view for tracking outstanding accounts receivable, Invoice balances, and payment records. Operators can review billed amounts with formatted currency values, filter invoices, sort by date or amount, select one or multiple invoices using row checkboxes, and delete selected records or individual invoices after confirmation.

**Blocked by:** 01: MongoDB Collections, Atomic Sequence Counters & Idempotent Seeding, 02: Deep Semantic HTML DataTable Component Module

**Status:** ready-for-human

- [x] Backend exposes `GET /api/v1/invoices` and `DELETE /api/v1/invoices/:id` with Fastify JSON Schema validation
- [x] Invoices reflect normalized numeric amounts and ISO-8601 timestamps
- [x] Frontend API client module and its in-memory testing fake provide `getInvoices` and `deleteInvoice` methods
- [x] Live `/invoices` view replaces the placeholder with the DataTable displaying formatted currency amounts (e.g. "$21.24") and localized dates
- [x] Row checkbox selection tracks active invoice selections and reveals a "Delete Selected" batch action in the table toolbar
- [x] Each row includes an individual delete action button with accessible labeling
- [x] Deleting an invoice prompts for operator confirmation before dispatching API deletion requests and updating the table
- [x] Automated tests verify invoice query endpoints, deletion handling, API client integration, and view selection/deletion flows


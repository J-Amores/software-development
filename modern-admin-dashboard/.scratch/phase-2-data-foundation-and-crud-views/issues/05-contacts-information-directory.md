# 05: Contacts Information Directory (/contacts)

**What to build:** An external directory view for browsing, filtering, and sorting client representatives and institutional Contacts. Operators can view detailed contact records—including registrar IDs, addresses, cities, zip codes, and phone numbers—in a responsive semantic table with real-time text search across all attributes and column sorting.

**Blocked by:** 01: MongoDB Collections, Atomic Sequence Counters & Idempotent Seeding, 02: Deep Semantic HTML DataTable Component Module

**Status:** resolved

- [x] Backend exposes `GET /api/v1/contacts` and `POST /api/v1/contacts` with Fastify JSON Schema validation supporting search and sorting
- [x] Contact records preserve registrar IDs, full street addresses, cities, zip codes, phone numbers, and email addresses
- [x] Frontend API client module and its in-memory testing fake provide `getContacts` and `createContact` methods
- [x] Live `/contacts` view replaces the placeholder with the DataTable configured for Contact records
- [x] Operators can search across contact names, emails, cities, and registrar IDs using instant client-side filtering
- [x] Table headers allow sorting contacts ascending and descending by clicking sortable column titles
- [x] View displays accessible loading and error states during API interactions
- [x] Automated tests verify API endpoints, schema validation, API client integration, and directory rendering behaviors

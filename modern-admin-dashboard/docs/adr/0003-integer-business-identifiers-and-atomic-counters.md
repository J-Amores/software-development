# 0003. Integer Business Identifiers and Atomic Counters for MongoDB

- **Status**: accepted
- **Date**: 2026-10-16

## Context

MongoDB uses 24-character hexadecimal `ObjectId` strings for document `_id` by default. However, the legacy dashboard dataset and REST API endpoints utilize human-readable, sequential integer identifiers (`id: 1, 2, ...`) for team members, contacts, and invoices. Migrating to arbitrary `ObjectId` strings in public URLs and table displays would break parity with legacy references and create awkward URL ergonomics (e.g., `/api/v1/team/507f1f77bcf86cd799439011` vs `/api/v1/team/1`).

## Decision

We will retain sequential integer `id` values as the canonical business identifier across the `members`, `contacts`, and `invoices` collections, backed by a dedicated `counters` collection utilizing atomic `findOneAndUpdate` operations (`$inc: { seq: 1 }`). Fastify JSON schemas and API serialization will project `id` as the primary key while omitting MongoDB's internal `_id` from client payloads.

## Consequences

- **Ergonomic URLs & Parity**: Clean, predictable REST endpoints (`/api/v1/team/:id`, `/api/v1/invoices/:id`) that align seamlessly with legacy tabular representations and mock datasets.
- **Race Condition Prevention**: Sequential integer allocation is safely coordinated across concurrent API requests via MongoDB's atomic `findOneAndUpdate` on the `counters` collection.
- **Seeding Coordination**: The database seed runner (`api/src/db/seed.js`) must initialize each collection's counter sequence to the maximum existing mock ID to prevent collision on subsequent user creation.

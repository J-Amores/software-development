# 03: Team Member Directory & Access Level Mutation (/team)

**What to build:** The complete end-to-end directory view for managing organizational Team Members. Operators can browse a live, paginated table of team collaborators, search by name or email, sort across attributes, view visual color-coded Access Level badges (`Admin`, `Manager`, `User`), and update a collaborator's Access Level inline with immediate persistence to the backend.

**Blocked by:** 01: MongoDB Collections, Atomic Sequence Counters & Idempotent Seeding, 02: Deep Semantic HTML DataTable Component Module

**Status:** resolved

- [x] Backend exposes `GET /api/v1/team` with Fastify JSON Schema validation supporting search queries and column sorting
- [x] Backend exposes `PATCH /api/v1/team/:id` validating updated Access Level tiers (`admin`, `manager`, `user`)
- [x] Frontend API client module and its in-memory testing fake provide `getTeamMembers` and `updateTeamMemberAccess` methods
- [x] Live `/team` view mounts the DataTable displaying Team Member ID, Name, Age, Phone, Email, and Access Level
- [x] Access Level values render with dedicated color-coded visual badges
- [x] Operators can change a Team Member's Access Level using an accessible inline selector, updating the record via the API and refreshing the row state
- [x] Failed network requests or server validation errors display user-friendly inline error alerts
- [x] Automated tests verify route handlers, schema validation rejections, API client behavior, and view rendering/mutation interactions

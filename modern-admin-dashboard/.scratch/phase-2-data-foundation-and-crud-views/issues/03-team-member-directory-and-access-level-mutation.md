# 03: Team Member Directory & Access Level Mutation (/team)

**What to build:** The complete end-to-end directory view for managing organizational Team Members. Operators can browse a live, paginated table of team collaborators, search by name or email, sort across attributes, view visual color-coded Access Level badges (`Admin`, `Manager`, `User`), and update a collaborator's Access Level inline with immediate persistence to the backend.

**Blocked by:** 01: MongoDB Collections, Atomic Sequence Counters & Idempotent Seeding, 02: Deep Semantic HTML DataTable Component Module

**Status:** ready-for-agent

- [ ] Backend exposes `GET /api/v1/team` with Fastify JSON Schema validation supporting search queries and column sorting
- [ ] Backend exposes `PATCH /api/v1/team/:id` validating updated Access Level tiers (`admin`, `manager`, `user`)
- [ ] Frontend API client module and its in-memory testing fake provide `getTeamMembers` and `updateTeamMemberAccess` methods
- [ ] Live `/team` view mounts the DataTable displaying Team Member ID, Name, Age, Phone, Email, and Access Level
- [ ] Access Level values render with dedicated color-coded visual badges
- [ ] Operators can change a Team Member's Access Level using an accessible inline selector, updating the record via the API and refreshing the row state
- [ ] Failed network requests or server validation errors display user-friendly inline error alerts
- [ ] Automated tests verify route handlers, schema validation rejections, API client behavior, and view rendering/mutation interactions

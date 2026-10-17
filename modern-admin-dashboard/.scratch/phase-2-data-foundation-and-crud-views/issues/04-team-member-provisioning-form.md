# 04: Team Member Provisioning Form with Constraint Validation (/form)

**What to build:** An accessible, zero-framework form for onboarding new internal Team Members into the organization. Operators can enter collaborator information and assign an authorized Access Level. The form enforces native HTML5 Constraint Validation, displays accessible inline error alerts on invalid inputs, creates the record with an automatically assigned sequential integer ID via the API, displays confirmation upon creation, and provides a direct navigation link to the team directory.

**Blocked by:** 01: MongoDB Collections, Atomic Sequence Counters & Idempotent Seeding

**Status:** resolved

- [x] Backend exposes `POST /api/v1/team` with Fastify JSON Schema validation requiring name, email, phone, age, and valid access level
- [x] Record creation automatically generates the next sequential integer ID via the atomic sequence counter
- [x] Frontend API client module and its in-memory testing fake provide a `createTeamMember` method
- [x] Live `/form` view replaces the placeholder with an accessible semantic HTML form
- [x] Client validation utilizes native HTML5 Constraint Validation APIs (`checkValidity()`, `validity` states) without external libraries
- [x] Missing or invalid fields trigger accessible inline error messages styled with theme tokens
- [x] Submitting valid data sends payload to the API and displays a prominent success confirmation banner with the new member's name and access level
- [x] Successful submission resets form fields and presents a direct action to navigate to `/team` via the client router
- [x] Automated tests verify API schema rejection on malformed bodies, atomic ID allocation, and form validation/submission flows in an isolated DOM

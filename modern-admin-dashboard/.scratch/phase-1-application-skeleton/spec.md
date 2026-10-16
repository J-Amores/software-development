# Phase 1: Application Skeleton (Walking Skeleton)

Status: resolved

## Problem Statement

The legacy administrative dashboard application is tightly coupled to Create React App, React 18, and Material UI, resulting in heavy client-side bundle overhead, fragile framework dependencies, and recurring migration churn. Furthermore, the application lacks an integrated backend API and persistence layer, relying instead on static mock data files that prevent realistic operational workflows for Operators managing Team Members, Contacts, Invoices, Calendar Events, and Campaign Metrics.

Operators need a modernized, high-performance administrative application that loads instantly, operates smoothly across light and dark visual environments, and provides reliable end-to-end connectivity to a managed backend service and database. Developers need an ergonomic, zero-framework architecture with clean module seams, fast local execution, and high-leverage automated testing that eliminates framework lock-in while preserving standard web conventions.

## Solution

Build the Phase 1 Walking Skeleton: an end-to-end, zero-framework web application and containerized backend API establishing the complete foundational architecture for the modern administrative dashboard.

The solution provides:
1. A monorepo workspace orchestrating a static web client and a containerized API service through a unified task toolchain, accompanied by local database containerization.
2. A zero-framework frontend application shell built with native HTML5, Light DOM Custom Elements, and CSS Custom Properties, featuring a responsive topbar, collapsible sidebar, instant theme switching with flash-of-unstyled-theme prevention, and deep client-side routing across all placeholder scene routes.
3. A lightweight, containerized backend HTTP service providing graceful container shutdown lifecycle handling and connection pooling to a document database via a single configuration parameter.
4. A live vertical tracer-bullet health check connecting the frontend dashboard directly to the backend API and database, verifying the operational integrity of the entire stack before feature scenes are built.
5. A testing architecture strictly anchored to three high-leverage seams (injectable frontend API adapter, in-memory backend HTTP injection, and an end-to-end browser smoke test).

## User Stories

1. As an Operator, I want to access a unified web application shell, so that I can oversee administrative operations and view organizational records from a central location.
2. As an Operator, I want an administrative topbar displaying operator identity, notification controls, and configuration actions, so that primary administrative controls are immediately accessible.
3. As an Operator, I want a collapsible sidebar navigation menu, so that I can switch between operational sections while maximizing available screen area for data management.
4. As an Operator, I want to toggle between light and dark visual themes with a single interaction, so that I can comfortably view and operate the dashboard in different lighting environments.
5. As an Operator, I want my selected visual theme to persist across browser reloads and sessions, so that I do not have to reconfigure my display preferences each time I open the application.
6. As an Operator, I want the application to automatically honor my operating system's light or dark mode preference on first visit, so that the dashboard defaults to my preferred environment without manual setup.
7. As an Operator, I want zero visual flicker or flash of unstyled theme when opening the dashboard, so that the loading experience is smooth and visually stable.
8. As an Operator, I want client-side navigation between administrative sections without full page reloads, so that switching views feels instant and responsive.
9. As an Operator, I want URL changes to update the browser address bar and history, so that I can bookmark specific dashboard sections and use standard browser forward and back navigation.
10. As an Operator, I want clicking standard navigation links in the sidebar, topbar, or views to transition routes seamlessly via client-side handling, so that web navigation feels natural and fluid.
11. As an Operator, I want placeholder stub views for all future administrative scenes (Team Members, Contacts, Invoices, Profile Form, Calendar Events, FAQ Entries, and Campaign Metrics), so that the entire operational structure is clear and navigable before individual modules are built.
12. As an Operator, I want to see an initial walking skeleton dashboard view, so that I can immediately verify that the client application and backend service are communicating successfully.
13. As an Operator, I want to see the live connectivity and operational health of the backend API and database on the dashboard, so that I have immediate confirmation that the administrative platform is functioning.
14. As an Operator, I want the dashboard to display an informative error state if the backend API or database is unreachable, so that I am promptly alerted to system outages.
15. As a Developer, I want a monorepo workspace managed through a unified toolchain, so that I can install dependencies, execute development servers, run builds, check code quality, and run tests through standardized commands.
16. As a Developer, I want a local database container orchestrated via standard container configuration, so that I can develop and test against a database locally without requiring an internet connection or shared remote instance.
17. As a Developer, I want the backend API to switch between a local database container and a remote managed database via a single environment variable, so that configuration is portable across local development and production environments with zero code modifications.
18. As a Developer, I want the backend HTTP server to expose an independent container liveness probe, so that container runtimes can monitor process health and restart unhealthy instances.
19. As a Developer, I want the backend HTTP server to provide a dedicated tracer-bullet health endpoint verifying end-to-end database connectivity, so that deployment pipelines and monitoring tools can validate live database reachability.
20. As a Developer, I want the backend HTTP server to handle termination signals gracefully, so that in-flight requests finish processing and database connection pools close cleanly during container teardown and auto-scaling.
21. As a Developer, I want the frontend app shell constructed using standard HTML5 and Light DOM Custom Elements, so that global theme tokens and styling cascade naturally without Shadow DOM boundaries.
22. As a Developer, I want the client-side router decoupled behind a minimal, deep module interface, so that views only need to supply a mount and unmount lifecycle.
23. As a Developer, I want all frontend views to interact with backend services through an injectable API client adapter seam, so that frontend components and navigation flows can be tested in memory without spinning up HTTP servers.
24. As a Developer, I want backend routes and validation to be testable via an in-memory HTTP injection seam, so that API contracts and database interactions can be verified rapidly in automated test suites without binding network ports.
25. As a Developer, I want an automated end-to-end smoke test validating the complete walking skeleton in a real browser, so that regressions in the app shell, theme toggling, routing, and live backend health integration are caught before release.
26. As a Developer, I want static hosting configuration supporting single-page application URL rewrites, so that direct navigation or refreshing a deep route does not result in 404 errors.

## Implementation Decisions

- **Monorepo Workspace Architecture**: The repository is organized into two primary projects within a unified package workspace: a static web application targeting static hosting and a containerized API service targeting container execution. A local container configuration defines a local document database service to facilitate offline development.
- **Unified Toolchain and Task Management**: Project operations are unified under a single toolchain CLI supporting environment runtime pinning, dependency installation, unified task execution (development, building, linting, formatting, and testing), and static bundling.
- **Zero-Framework Frontend Runtime**: The frontend application contains zero runtime component or UI framework dependencies. It is implemented using native browser standards: HTML5, native ECMAScript Modules, Light DOM Custom Elements, and standard CSS. Light DOM is strictly mandated for custom elements to preserve global stylesheet cascading and eliminate Shadow DOM style encapsulation hurdles.
- **App Shell Component Decomposition**: The application shell is partitioned into three collaborating Light DOM custom elements: an overarching shell element coordinating the layout grid, an administrative topbar handling utility actions and theme controls, and a collapsible sidebar presenting navigation links organized by domain section.
- **Design System Tokens and Theme Management**: Color scales and UI attributes from the legacy design system are mapped into CSS Custom Properties declared under dark and light theme selectors on the root document element. A dedicated theme management module controls theme transitions, persists operator preference in browser storage, and detects system color preferences. An inline initialization script in the document head applies the initial theme attribute prior to first layout render to guarantee zero flash of unstyled content.
- **Deep Client-Side Router**: Navigation is managed by a deep router module exposing a minimal two-method interface for initialization and programmatic navigation. The router coordinates with the browser History API, intercepts internal navigation link clicks via document-level event delegation, and dispatches route changes to view containers. Deep route requests on static hosting are routed to the main document through a single-page application rewrite rule.
- **View Lifecycle Seam**: Views adhere to a uniform lifecycle contract presenting mount and unmount operations. Placeholder stub views render consistent semantic headings and breadcrumb metadata for all 10 future administrative scenes. The primary dashboard view mounts the live walking skeleton tracer bullet displaying API connectivity and database ping status.
- **Containerized Backend Server and Lifecycle**: The backend API is built on a high-throughput, low-overhead HTTP runtime packaged in a minimal multi-stage container image. It implements graceful shutdown hooks for termination signals, draining pending requests and cleanly terminating database connection pools within container runtime deadlines.
- **Database Adapter Module**: Persistence interactions are encapsulated behind a deep database adapter module exposing connection lifecycle controls and connectivity verification. The adapter reads a single database connection URI string to support transparent switching between local containerized databases and managed cloud clusters.
- **Dual Health and Tracer Bullet Endpoints**: The API exposes two distinct health endpoints: a basic liveness endpoint returning immediate server status for container orchestrators, and a versioned tracer-bullet health endpoint that actively validates roundtrip database connectivity and reports operational metrics.

## Testing Decisions

- **Testing Principles**: Tests must exclusively exercise external behavior at defined module seams. Verifying internal private state, unexported helper functions, or ephemeral implementation mechanics is strictly forbidden.
- **Frontend Seam (Component & Route Testing)**: Frontend testing exercises the application shell, router, and view lifecycle against an injectable API client adapter interface. Production execution uses a network client adapter, while automated component tests provide an in-memory fake client adapter. This enables comprehensive UI testing without network overhead.
- **Backend Seam (Route & Contract Testing)**: Backend testing exercises the HTTP routing layer and request/response validation through an in-memory HTTP injection interface. Tests execute full request dispatch, serialization, and status handling against the database adapter seam without opening network listening ports.
- **End-to-End Smoke Seam (Walking Skeleton Verification)**: A single automated end-to-end browser smoke test verifies the integrated system in a headless browser: confirming the shell renders, exercising the dark/light mode toggle, clicking navigation links across route stubs, and asserting successful retrieval and display of live health data from the backend API.
- **Prior Art**: The legacy application contained minimal, fragile component unit tests tied to React-specific test renderers. Our modernized testing strategy establishes durable, framework-independent behavioral seams with high coverage and fast execution.

## Out of Scope

- Full functional implementations of the 11 domain scenes (Team Member data grid, Contacts directory, Invoices table with balance calculations, Operator profile creation form, Calendar scheduling engine, FAQ accordion views, and Bar/Pie/Line/Geography chart visualizations).
- Operator authentication, authorization checks, and session credential management.
- Production database seed scripts, schema validations, or administrative migration jobs.
- Complex client-side global state synchronization stores or external reactive state libraries.
- Mobile native application compilation or progressive web app offline caching service workers.

## Further Notes

- The project's pure business domain terminology is maintained in `GLOSSARY.md` at the repository root and must be strictly adhered to across all future specifications and tickets.
- Hard-to-reverse architectural decisions are preserved in `docs/adr/0001-zero-framework-web-standards-and-vite-plus.md` and `docs/adr/0002-cloud-run-and-mongodb-atlas-split.md`.
- Following approval of this specification, implementation tickets will be generated under `.scratch/phase-1-application-skeleton/issues/` using `/to-tickets`.

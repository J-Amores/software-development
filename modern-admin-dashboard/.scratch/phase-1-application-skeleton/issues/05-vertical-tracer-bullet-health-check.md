# 05: Vertical Tracer-Bullet Health Check and API Client Seam

**What to build:** An end-to-end vertical tracer bullet connecting the frontend dashboard to the backend API and database, supported by an injectable API client adapter seam on the frontend and an active database ping health endpoint on the backend.

**Blocked by:** 02: Backend API Container and Database Adapter Seam, 04: Client-Side Router and Scene Placeholder Stubs

**Status:** ready-for-agent

- [ ] Backend API exposes a versioned tracer-bullet health endpoint that actively validates database roundtrip ping latency and returns system health metadata
- [ ] Frontend API client module abstracts network requests behind a pluggable interface supporting both live fetch and in-memory test implementations
- [ ] Primary dashboard view queries the health endpoint and renders live operational indicators: API status, database ping response, and environment mode
- [ ] Dashboard view displays an accessible, informative error fallback state when the API or database connection is unreachable
- [ ] Automated tests verify dashboard view behavior and error handling states against an in-memory fake API adapter without live HTTP requests

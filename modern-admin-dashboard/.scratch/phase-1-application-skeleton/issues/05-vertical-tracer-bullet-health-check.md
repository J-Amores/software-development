# 05: Vertical Tracer-Bullet Health Check and API Client Seam

**What to build:** An end-to-end vertical tracer bullet connecting the frontend dashboard to the backend API and database, supported by an injectable API client adapter seam on the frontend and an active database ping health endpoint on the backend.

**Blocked by:** 02: Backend API Container and Database Adapter Seam, 04: Client-Side Router and Scene Placeholder Stubs

**Status:** resolved

- [x] Backend API exposes a versioned tracer-bullet health endpoint that actively validates database roundtrip ping latency and returns system health metadata
- [x] Frontend API client module abstracts network requests behind a pluggable interface supporting both live fetch and in-memory test implementations
- [x] Primary dashboard view queries the health endpoint and renders live operational indicators: API status, database ping response, and environment mode
- [x] Dashboard view displays an accessible, informative error fallback state when the API or database connection is unreachable
- [x] Automated tests verify dashboard view behavior and error handling states against an in-memory fake API adapter without live HTTP requests

## Comments

### Implementation Details
- **Backend API (`api/src/routes/health.js`)**: Updated `GET /api/v1/health` to supply environment mode (`process.env.NODE_ENV || "development"`) alongside database roundtrip latency and timestamp across all states (operational, degraded, disabled).
- **Frontend API Client Seam (`web/src/api/index.js`)**: Deep module exposing `createApiClient` (network fetch adapter) and `createFakeApiClient` (in-memory test adapter with configurable responses and rejections).
- **Dashboard View (`web/src/views/dashboard-view.js`)**: Mounts tracer bullet telemetry cards displaying live API status, database ping response, environment mode, and probe timestamp. Renders accessible error alert (`role="alert"`) and retry trigger when API or database is unreachable or degraded.
- **Verification**: 37/37 automated tests passing across 6 suites; 100% code formatted and 0 lint warnings via `vp check`. Production build bundled in ~410ms.

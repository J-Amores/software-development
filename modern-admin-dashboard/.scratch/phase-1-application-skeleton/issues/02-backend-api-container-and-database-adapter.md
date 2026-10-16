# 02: Backend API Container and Database Adapter Seam

**What to build:** A lightweight, containerized backend HTTP service featuring graceful termination signal lifecycle management, a deep database adapter module connecting to a document database via a single connection URI, an independent liveness probe, and in-memory HTTP route contract tests.

**Blocked by:** 01: Workspace Setup and Unified Toolchain Initialization

**Status:** ready-for-agent

- [x] HTTP server initializes with low overhead and responds to basic liveness health checks
- [x] Database adapter encapsulates connection lifecycle and connection pooling, reading a single connection URI configuration variable
- [x] Process termination hooks intercept SIGTERM and SIGINT to flush pending requests and close database connection pools cleanly during container teardown
- [x] Multi-stage container definition packages the production API service for containerized execution
- [x] Automated contract tests exercise HTTP routing and lifecycle hooks via in-memory request injection without opening live network ports

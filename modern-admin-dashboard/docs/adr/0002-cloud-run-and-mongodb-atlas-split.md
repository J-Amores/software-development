# 0002. Containerized Cloud Run API and MongoDB Atlas Split

- **Status**: accepted
- **Date**: 2026-10-16

## Context

The modern administrative dashboard requires an API layer that can perform reliable business validation, handle database connection pooling, and execute background or admin tasks, paired with a scalable managed database. Deploying API logic into edge functions (e.g., Cloudflare Workers) introduces severe database connection pooling constraints and runtime memory limitations when interacting with stateful database instances.

## Decision

We will deploy the backend API as an independent, containerized service on Google Cloud Run connecting directly to MongoDB Atlas:
- **Runtime**: Node.js 22 LTS containerized with a minimal multi-stage Dockerfile, powered by Fastify for low overhead, fast startup, and native JSON schema validation.
- **Database Driver & Seam**: The official native `mongodb` driver encapsulated behind an explicit database adapter module (`createDatabaseAdapter`) exposing `connect()`, `disconnect()`, and `ping()`, strictly rejecting heavy ORMs such as Mongoose.
- **Connection Lifecycle**: Connection pooling tuned for Cloud Run auto-scaling, with explicit hooks listening to `SIGTERM` and `SIGINT` signals to flush pending requests and cleanly close database connection pools during container teardown.
- **Environment Configuration**: The backend consumes a single `MONGODB_URI` environment variable, enabling seamless switching between local Docker Compose MongoDB for development and MongoDB Atlas in production.

## Consequences

- **Decoupled Deployments**: The frontend (Cloudflare Pages static assets) and API (Cloud Run container) deploy independently with no cross-service build coupling.
- **Standard Linux Container Portability**: The API container can be built, inspected, and run locally or on any OCI-compliant container platform.
- **Clean Health Seam**: Exposes `/health` for Cloud Run container orchestrator liveness checks and `/api/v1/health` as a tracer bullet probe for verified MongoDB Atlas connectivity.

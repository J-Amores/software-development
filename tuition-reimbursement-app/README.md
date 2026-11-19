# Tuition Reimbursement

An employer-sponsored program where people apply to have course tuition paid back,
approved against a yearly per-person allowance. `docs/SPEC.md` is the governing
specification, `GLOSSARY.md` defines the domain terms, and `docs/adr/` records the
decisions.

Right now the repository holds the walking skeleton: the thinnest path through
every layer, with no domain behavior in it (ticket 01).

## Run it

Everything runs locally, in Docker, against real Postgres and the AWS Emulator. No
build, test or demo reaches live AWS (ADR 0003). You need Docker; you do not need a
JDK, Node or an AWS account.

```bash
./dev up          # Postgres, the AWS Emulator, the backend and the frontend
./dev demo        # the public demo's build: the frontend against the in-browser mock
./dev test        # the backend's suite, in a container
./dev round-trip  # the skeleton's one test, in a real browser (needs ./dev up)
./dev down        # stop everything and drop the volumes
```

| Where | What |
| --- | --- |
| http://127.0.0.1:5173 | the app |
| http://127.0.0.1:5174 | demo mode (`./dev demo`) |
| http://127.0.0.1:8080/api/health | Postgres and S3 reachability, and the clock |
| http://127.0.0.1:8080/api/me | the signed-in Person, read from their token |
| https://127.0.0.1:9297 | the AWS Emulator (S3, Cognito, Secrets Manager) |

Sign in as `ada@darkowl.test` with `Passw0rd!2026`. The seed script creates that
Person, the user pool, the documents bucket and the database secret on every boot
(`tools/aws-emulator/seed.sh`); the Faker cast of People arrives with ticket 16.

To use the AWS CLI against the same emulator, point it at the files the emulator
wrote to `~/.aws/emulator/9297/` (the `aws-emulator` skill's `connect` reference has
the variables).

## Layout

| Area | Holds |
| --- | --- |
| `contract/` | `openapi.yaml`, the source of truth for the API, and the commands that lint it and generate from it (ADR 0004) |
| `backend/` | Java 25 / Spring Boot 4, as Spring Modulith domain modules (ADR 0006) |
| `web/` | React 19 / Vite / TypeScript, plus the in-browser mock that powers demo mode (ADR 0005) |
| `infra/` | Terraform for an Employer's own AWS account (ticket 17) |
| `tools/` | the emulator image and seed script, and the checks CI runs |
| `docs/` | the spec, the ADRs and the Demo Scenarios |

## Working on it

- `contract/openapi.yaml` comes first. The backend implements interfaces generated
  from it, so a controller that does not match the contract does not compile, and
  `npm --prefix contract run generate` regenerates the TypeScript client, which is
  committed. CI fails if the committed client is not what the contract produces.
- Tests are the specification and are read-only during implementation (ADR 0008).
  CI refuses any commit that changes an existing test and production code together.
- Migrations arrive one slice at a time, one DDL statement per file, no DML, no
  sequences, triggers or stored procedures: Aurora DSQL allows none of it
  (ADR 0007). `tools/ci/check-dsql-sql.sh` enforces it.
- The app reads the current date and time from an injected clock, never from
  `Instant.now()`, so tests can set it.

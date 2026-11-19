# Tuition Reimbursement

An employer-sponsored program where people apply to have course tuition paid back,
approved against a yearly per-person allowance. A Manager confirms the Course is
relevant to the job, a Benefits Coordinator approves an amount against the
Applicant's Annual Allowance, and approved amounts reach payroll as an export.

Java 25 / Spring Boot 4 backend organized as Spring Modulith domain modules, a
React 19 / Vite / TypeScript frontend, a contract-first OpenAPI API, and a
serverless AWS deployment that stays inside the always-free limits. It is
developed entirely locally, against real Postgres and the AWS Emulator.

Right now the repository holds the walking skeleton: the thinnest path through
every layer, with no domain behavior in it.

## Run it

Everything runs locally, in Docker. No build, test or demo reaches live AWS, so
Docker is all you need for the app and its tests: no JDK, no Node and no AWS
account. The one exception is `./dev round-trip`, which drives a real browser
through the `agent-browser` CLI and so needs that on the host
(`npm i -g agent-browser && agent-browser install`).

```bash
./dev up          # Postgres, the AWS Emulator, the backend and the frontend
./dev demo        # the frontend against the in-browser mock, with no backend
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
Person, the Cognito user pool, the documents bucket and the database secret on
every boot (`tools/aws-emulator/seed.sh`).

## Layout

| Area | Holds |
| --- | --- |
| `contract/` | `openapi.yaml`, the source of truth for the API, and the commands that lint it and generate from it |
| `backend/` | Java 25 / Spring Boot 4, as Spring Modulith domain modules |
| `web/` | React 19 / Vite / TypeScript, plus the in-browser mock that powers demo mode |
| `infra/` | Terraform for an Employer's own AWS account |
| `tools/` | the AWS Emulator image and seed script, and the checks CI runs |

## How it is built

- **Contract first.** `contract/openapi.yaml` is the source of truth. The backend
  implements interfaces generated from it, so a controller that does not match the
  contract does not compile; the frontend's TypeScript client and the demo's mock
  handlers are generated from it too. CI regenerates all three and fails if what is
  committed differs.
- **Local only.** Docker Compose runs real Postgres and the AWS Emulator, which
  provides S3, Cognito and Secrets Manager. The Cognito issuer and the S3 endpoint
  are configuration, so the same build runs locally and on AWS. Deploying is
  optional and manual; nothing on any other path depends on live AWS.
- **Tests first, and read-only.** Every behavior gets its test before the code, and
  during implementation the tests are the specification: only production code
  changes until they pass. CI refuses any commit that changes an existing test and
  production code together. The walking skeleton is the one exception, and its only
  test is the frontend-to-backend round trip.
- **Aurora DSQL's SQL.** Keys are application-generated UUIDs, every migration holds
  exactly one DDL statement and no DML, and there are no sequences, triggers or
  stored procedures. `tools/ci/check-dsql-sql.sh` enforces it, so nothing works
  locally that would break in AWS.
- **An injected clock.** The app never calls `Instant.now()`: it reads the current
  date and time from a clock tests can set, which is how dates, Business Days and
  deadlines are tested.

Comments in the code cite decisions as ADR numbers. Those records, along with the
specification, the domain glossary and the tickets, are kept outside this
repository.

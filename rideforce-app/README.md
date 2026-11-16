# RideForce

RideForce is a ride dispatch demo built around one pickup area: the Airport Corridor, a stretch of road in front of an airport terminal. A dispatcher watches the area in 3D, picks a waiting rider, and sends a driver to them. Every dispatch goes through a queue, a background worker, and an audit table, all running on AWS service APIs.

You do not need an AWS account. The AWS APIs are served on your machine by [AWS Emulator](https://github.com/aws/aws-emulator), AWS's open-source local emulator, and the whole stack runs in Docker Compose.

## What the app does

The map shows the terminal, its five pickup doors, the main corridor road, and a staging lot where idle drivers park. There are ten drivers: six start parked in the lot and four cruise the roads. Each driver is in one of three states, shown by its beacon color: available (green), en route to a pickup (amber), or on a trip (rose). Riders appear as blue pins at the pickup doors, and a new one arrives every nine seconds until five are waiting.

When you select a waiting rider, the app draws lines to the three closest available drivers that have enough seats for the rider's party. Each line has a badge with the distance in kilometers and an estimated arrival time in minutes. Drivers farther away than the maximum match radius (2.4 km) are left out.

Pressing Dispatch commits that driver to the rider. The driver drives along the roads to the curb, picks the rider up, leaves the area by the east or west exit depending on the destination, and then returns to the staging lot as available again.

The telemetry panel shows the state of the cloud side: how many messages are waiting in the queue or being retried, how many sit in the dead-letter queue, how many the worker has processed, and the most recent audit log entries. Three buttons let you exercise that side directly:

- Simulate GPS Tick publishes a position update for every driver to the queue and nudges the drivers that are cruising the corridor.
- Inject PoisonPill sends a malformed event. The worker rejects it, SQS retries it, and after the third failed receive SQS moves it to the dead-letter queue. The health badge turns to DEGRADED while it is there, and dispatching keeps working.
- Replay DLQ moves dead-lettered messages back to the main queue, marked as repaired, so the worker can process them.

The interface comes in three layouts that you can switch between with the bar at the bottom of the screen, the `?variant=` URL parameter, or the keys 1, 2, and 3:

| Variant | Layout |
| --- | --- |
| `template-classic` | A floating top bar and a bottom status bar, with an inspector that slides in when you select a rider or driver |
| `tactical-split` | A rider queue and dispatch drawer on the left, the 3D view in the middle, and AWS telemetry and chaos controls on the right |
| `radar-hud` | A full-screen 3D view with a docked command deck containing a radar scope, the waiting riders, the driver ranking, and queue health |

## AWS services used

| Service | Resource | What RideForce uses it for |
| --- | --- | --- |
| Amazon S3 | Bucket `rideforce-spatial-manifests`, object `zones/airport-corridor.json` | The zone manifest: pickup door positions, staging lot slots, exits, destinations, and the map scale. The API reads it at startup. |
| Amazon SQS | Queue `dispatch-events` | Every dispatch, status change, and GPS update is sent here as an event. The visibility timeout is 2 seconds, so a rejected message comes back quickly. |
| Amazon SQS | Queue `dispatch-events-dlq` | The dead-letter queue. The redrive policy on `dispatch-events` moves a message here after 3 failed receives (`maxReceiveCount = 3`). |
| Amazon DynamoDB | Table `dispatch-audit` (`pk` partition key, `sk` sort key) | The audit log. Each row records an event type, a description, a severity, and a timestamp. The same table holds the counter of processed messages. |
| AWS Systems Manager Parameter Store | Parameter `/rideforce/dispatch/max-match-radius-km` | The maximum distance, in kilometers, at which a driver can be matched to a rider. The API reads it at startup and sends it to the browser with every snapshot. |
| AWS STS | | Terraform calls it to confirm whose credentials it is using. The emulator always answers with account `000000000000`. |

Terraform creates all of these resources (see `infra/terraform/main.tf`). The Python services talk to them with boto3.

## How a dispatch moves through the system

1. In the browser, you press Dispatch. The frontend sends `POST /api/dispatch-assignments` with the rider and driver IDs.
2. The FastAPI service checks that the rider is still waiting, that the driver is available and has enough seats, and that the driver is inside the match radius. If any check fails it answers with HTTP 409.
3. The service updates its fleet simulation, sends a `DISPATCH_ASSIGNMENT` event to SQS, and pushes a new snapshot to every connected browser over Server-Sent Events.
4. The worker receives the event, validates its fields, writes an `ASSIGNMENT_COMMITTED` row to DynamoDB, increments the processed counter, and deletes the message.
5. While the driver moves, the API streams positions to the browser about ten times a second. When the driver reaches the rider and later the exit, the API sends `STATUS_TRANSITION` events, which the worker audits the same way.
6. Once a second, the API reads queue depths, the dead-letter queue, and the latest audit rows, and adds them to the next snapshot for the telemetry panel.

The worker never deletes a message it cannot validate, and it never moves messages itself. The SQS redrive policy moves a rejected message to the dead-letter queue, and the worker only records what happened: a `RECEIVE_FAILED` row for each failed attempt and a `DLQ_ISOLATED` row on the last one.

## Services

`docker-compose.yml` starts five services:

| Service | Image | Role |
| --- | --- | --- |
| `aws-emulator` | Built from `infra/aws-emulator/Dockerfile` | Serves the AWS APIs over HTTPS on port 9297. The image installs the latest LTS package of AWS Emulator. Telemetry is turned off. |
| `terraform` | Built from `infra/terraform/Dockerfile` (Terraform 1.9.8, AWS provider 5.x) | Creates the AWS resources, then exits. It runs on every startup and keeps its state in the `tfstate` volume, so a second run makes no changes and a run after an emulator restart recreates everything. |
| `api` | Built from `backend/` (Python 3.12, FastAPI, boto3) | Runs the fleet simulation, accepts commands, sends events to SQS, and streams snapshots and positions to the browser. |
| `worker` | Same image as `api` | Long-polls `dispatch-events`, validates each event, and writes the audit log to DynamoDB. |
| `frontend` | Built from `frontend/` (React 19, Three.js through React Three Fiber, Tailwind CSS, served by nginx) | Serves the app on port 8080 and forwards `/api` requests to the API. |

AWS Emulator creates a new TLS certificate each time it starts, and that certificate is only valid for `127.0.0.1` and `localhost`. So `api`, `worker`, and `terraform` share the emulator's network namespace (`network_mode: service:aws-emulator`) and connect to `https://127.0.0.1:9297` with certificate checking on. They read that run's credentials, config, and CA certificate from `~/.aws/emulator/9297/`, which is mounted read-only. Those files change on every start and are not part of the repository.

All published ports are bound to `127.0.0.1`, so nothing is reachable from other machines on your network.

## Running it

You need Docker Desktop, and Node.js 22 if you want to run the frontend outside Docker.

Start the stack:

```bash
scripts/up.sh
```

The script creates `~/.aws/emulator/9297/`, clears any AWS credentials from the environment so nothing can reach real AWS, starts the services in order, and waits until the API and frontend respond. The first run takes a few minutes because it builds the images and Terraform waits for the SQS queues to finish creating.

| URL | What is there |
| --- | --- |
| http://127.0.0.1:8080 | The app |
| http://127.0.0.1:8000/api/snapshot | The current state as JSON |
| https://127.0.0.1:9297 | AWS Emulator |

To stop everything:

```bash
docker compose down
```

The emulator keeps its data in memory, so stopping it clears every queue, table, and object. The next `scripts/up.sh` creates them again. If only the `aws-emulator` container restarts, its credentials change and the API and worker can no longer sign requests, so restart the whole stack with `docker compose down` followed by `scripts/up.sh`.

### Running the frontend on its own

The frontend can also run without any backend:

```bash
cd frontend
npm install
npm run dev
```

This opens on http://127.0.0.1:5173 and uses a simulation that runs in the browser, including a simulated queue, dead-letter queue, and audit log. Add `?gateway=http` to the URL to use the Docker backend instead; the Vite dev server forwards `/api` to port 8000. The badge in the bottom bar shows which mode is active.

## Tests

```bash
scripts/verify.sh
```

This runs shellcheck on the scripts, the backend unit tests in a Python 3.12 container, a production build of the frontend, and then starts the stack and runs the integration tests against it. The integration tests run inside the emulator's network namespace and check that:

- A dispatch shows up in the DynamoDB audit log after the worker processes it.
- A PoisonPill ends up in the dead-letter queue through the SQS redrive policy, and Replay DLQ brings the count back to zero.
- The worker consumes GPS ticks from the queue.
- The event stream sends a snapshot followed by position updates.

The unit tests cover the simulation, the driver ranking, the worker's validation and retry rules, and the API endpoints. They use in-memory replacements for SQS and DynamoDB, so they do not need the emulator.

## Project layout

```
backend/
  rideforce/
    api.py              FastAPI app, SSE stream, background loops
    simulation.py       Fleet simulation (no AWS calls)
    worker.py           SQS consumer and event validation
    aws.py              boto3 access to S3, SQS, DynamoDB, and SSM
    domain.py           Drivers, riders, dispatches, and driver ranking
    zone_manifest.json  Airport Corridor layout, uploaded to S3 by Terraform
  tests/
frontend/
  src/
    gateway/            DispatchGateway interface, in-browser and HTTP implementations
    scene/              3D scene: zone, driver beacons, rider pins, link lines, camera
    hud/                Panels shared by the three layouts
    variants/           The three layouts
infra/
  aws-emulator/         Dockerfile for AWS Emulator
  terraform/            Terraform config and its Dockerfile
scripts/
  up.sh                 Start the stack
  verify.sh             Lint, test, build, and integration test
docker-compose.yml
```

The frontend's 3D view and panels only talk to one interface, `DispatchGateway`. The in-browser simulation and the HTTP client both implement it, so the same screens run with or without the backend.

## Limits

AWS Emulator is for local development and testing. Its data lives only in memory, every request runs in a single account (`000000000000`), and it does not enforce IAM policies, so RideForce does not test permissions. Driver positions, riders, and dispatches live in the API process and reset when it restarts; only the audit log and counters are stored in DynamoDB, and those are cleared when the emulator stops.

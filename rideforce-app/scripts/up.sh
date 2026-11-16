#!/usr/bin/env bash
# Start the RideForce stack: aws-emulator -> terraform -> api + worker -> frontend.
set -euo pipefail
cd "$(dirname "$0")/.."

# Must exist before Docker mounts it, or Docker creates it owned by root and SDKs cannot read it.
mkdir -p "${HOME}/.aws/emulator/9297"

# Keep real AWS credentials away from anything that talks to the emulator.
unset AWS_ACCESS_KEY_ID AWS_SECRET_ACCESS_KEY AWS_SESSION_TOKEN AWS_PROFILE AWS_DEFAULT_PROFILE

docker compose up --build -d "$@"

# `up --wait` can stall on the one-shot terraform dependency; poll the api health instead.
for _ in $(seq 90); do
  if curl -sf http://127.0.0.1:8000/healthz >/dev/null && curl -sf http://127.0.0.1:8080/ >/dev/null; then
    break
  fi
  sleep 2
done
curl -sf http://127.0.0.1:8000/healthz >/dev/null || { docker compose ps -a; docker compose logs --tail 40 terraform api; exit 1; }
echo "RideForce:  http://127.0.0.1:8080   (API http://127.0.0.1:8000, emulator https://127.0.0.1:9297)"

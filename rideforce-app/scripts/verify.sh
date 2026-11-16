#!/usr/bin/env bash
# Verification gate: lint, unit tests, production build, full-stack integration tests.
set -euo pipefail
cd "$(dirname "$0")/.."

step() { printf '\n\033[1m== %s\033[0m\n' "$1"; }

step "shellcheck"
shellcheck scripts/*.sh

step "backend unit tests (python:3.12 container)"
docker build -q --target test -t rideforce-backend-test backend >/dev/null
docker run --rm rideforce-backend-test pytest -q -p no:warnings

step "frontend typecheck + build"
(cd frontend && npm ci --silent && npm run build --silent)

step "compose stack up"
scripts/up.sh

step "integration tests (inside the emulator's network namespace)"
emulator_container="$(docker compose ps -q aws-emulator)"
docker run --rm --network "container:${emulator_container}" rideforce-backend-test \
  pytest -q -p no:warnings -m integration

step "frontend served"
curl -sf http://127.0.0.1:8080/ >/dev/null
curl -sf http://127.0.0.1:8080/api/snapshot >/dev/null
echo "verify: OK"

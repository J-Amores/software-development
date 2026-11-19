#!/bin/sh
# The user pool and app client the seed script created this time round reach Vite
# as environment variables, so there is one code path for configuration: the same
# VITE_ variables are set at build time for AWS.
set -eu
if [ -n "${SEED_ENV:-}" ]; then
  waited=0
  while [ ! -f "$SEED_ENV" ]; do
    [ "$waited" -ge 60 ] && echo "gave up waiting for $SEED_ENV" >&2 && exit 1
    sleep 1
    waited=$((waited + 1))
  done
  # shellcheck source=/dev/null
  . "$SEED_ENV"
  export VITE_COGNITO_CLIENT_ID
fi
exec "$@"

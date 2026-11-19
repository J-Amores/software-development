#!/usr/bin/env bash
# The walking skeleton's only test (ADR 0008, seam 4): a Person signs in, the home
# page asks the backend who they are through the generated client, and the page
# shows what came back.
#
# Needs the stack up (`./dev up`). Everything else in the system is wired here but
# first tested by the slice that depends on it.
set -euo pipefail

APP_URL=${APP_URL:-http://127.0.0.1:5173}
API_URL=${API_URL:-http://127.0.0.1:8080/api}
PERSON=${PERSON:-ada@darkowl.test}
PASSWORD=${PASSWORD:-Passw0rd!2026}
EXPECTED_NAME=${EXPECTED_NAME:-Ada Lovelace}

session=$(agent-browser session id --scope worktree --prefix tuition-round-trip)
trap 'agent-browser close --session "$session" >/dev/null 2>&1 || true' EXIT

fail() { echo "ROUND TRIP FAILED: $*" >&2; exit 1; }

echo "waiting for the API to report itself up"
for _ in $(seq 60); do
  [ "$(curl -s -o /dev/null -w '%{http_code}' "$API_URL/health")" = "200" ] && break
  sleep 1
done
curl -sf "$API_URL/health" >/dev/null || fail "$API_URL/health never reported up"

echo "signing in as $PERSON at $APP_URL"
agent-browser open "$APP_URL" --session "$session" >/dev/null
agent-browser wait --text "Sign in" --session "$session" >/dev/null

agent-browser fill "#email" "$PERSON" --session "$session" >/dev/null
agent-browser fill "#current-password" "$PASSWORD" --session "$session" >/dev/null
agent-browser click "button[type=submit]" --session "$session" >/dev/null

echo "reading the identity the backend sent back"
agent-browser wait --text "Signed in as" --session "$session" >/dev/null \
  || fail "the home page never showed an identity from the backend"

shown=$(agent-browser get text '[data-testid="signed-in-as"]' --session "$session")
case "$shown" in
  *"$EXPECTED_NAME"*) echo "the page shows \"$shown\", which is what the backend read from the token" ;;
  *) fail "the page shows \"$shown\", not \"$EXPECTED_NAME\"" ;;
esac

echo "ROUND TRIP PASSED"

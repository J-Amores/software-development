#!/usr/bin/env bash
set -euo pipefail

echo "=================================================="
echo "Running RideForce Gateway & Orchestration Verification"
echo "=================================================="

GATEWAY_URL="http://localhost:80"

# 1. Container health checks
echo "--> Checking Docker Compose service health states..."
for service in db backend frontend; do
    container_id=$(docker compose ps -q "$service" 2>/dev/null || true)
    if [ -z "$container_id" ]; then
        echo "FAIL: Service '$service' container not found or not running"
        exit 1
    fi
    health_status=$(docker inspect --format='{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}' "$container_id" 2>/dev/null || echo "unknown")
    echo "    Service '$service' health: $health_status"
    if [ "$health_status" != "healthy" ]; then
        echo "FAIL: Service '$service' is not healthy (status: $health_status)"
        exit 1
    fi
done

# 2. Web Gateway root SPA check
echo "--> Verifying GET $GATEWAY_URL/ (React SPA)..."
TMP_ROOT_BODY=$(mktemp)
trap 'rm -f "$TMP_ROOT_BODY"' EXIT

http_code=$(curl -fsSL -o "$TMP_ROOT_BODY" -w "%{http_code}" "$GATEWAY_URL/")
if [ "$http_code" != "200" ]; then
    echo "FAIL: Root endpoint returned HTTP $http_code (expected 200)"
    exit 1
fi
if ! grep -qi "<html" "$TMP_ROOT_BODY"; then
    echo "FAIL: Root endpoint did not return HTML content"
    exit 1
fi
echo "    Root SPA responded with HTTP 200 OK"

# 3. Actuator health check through gateway
echo "--> Verifying GET $GATEWAY_URL/actuator/health..."
health_json=$(curl -fsS "$GATEWAY_URL/actuator/health")
if ! echo "$health_json" | grep -q '"status":"UP"'; then
    echo "FAIL: Actuator health status is not UP. Response: $health_json"
    exit 1
fi
echo "    Actuator health is UP"

# 4. GET /api/matches check through gateway
echo "--> Verifying GET $GATEWAY_URL/api/matches..."
matches_json=$(curl -fsS "$GATEWAY_URL/api/matches")
if [ -z "$matches_json" ]; then
    echo "FAIL: Matches endpoint returned empty response"
    exit 1
fi
echo "    GET /api/matches returned valid matches payload"

# 5. POST /api/matches check through gateway
echo "--> Verifying POST $GATEWAY_URL/api/matches..."
post_response=$(curl -fsS -X POST "$GATEWAY_URL/api/matches" \
    -H "Content-Type: application/json" \
    -d '{"riderId": 2, "driverId": 2}')
if ! echo "$post_response" | grep -q '"status":"CONFIRMED"'; then
    echo "FAIL: Dispatch match POST did not return CONFIRMED status. Response: $post_response"
    exit 1
fi
echo "    POST /api/matches confirmed match successfully"

# 6. Backend non-root user verification
echo "--> Verifying backend container runs as non-root user 'spring'..."
backend_user=$(docker compose exec -T backend whoami | tr -d '\r\n')
echo "    Backend container user: $backend_user"
if [ "$backend_user" != "spring" ]; then
    echo "FAIL: Backend running as '$backend_user' (expected 'spring')"
    exit 1
fi

echo "=================================================="
echo "ALL PLATFORM VERIFICATION CHECKS PASSED!"
echo "=================================================="

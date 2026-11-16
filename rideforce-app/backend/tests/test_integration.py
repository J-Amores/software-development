"""Black-box checks against the running compose stack (aws-emulator + terraform + api + worker).

Run inside the emulator's network namespace: scripts/verify.sh does this.
"""

import os
import time

import httpx
import pytest

pytestmark = pytest.mark.integration
API = os.getenv("RIDEFORCE_API", "http://127.0.0.1:8000")


def snapshot() -> dict:
    return httpx.get(f"{API}/api/snapshot", timeout=5).json()


def wait_for(fn, timeout: float, what: str):
    end = time.time() + timeout
    while time.time() < end:
        v = fn()
        if v:
            return v
        time.sleep(0.5)
    raise AssertionError(f"timed out waiting for {what}")


def audit_types() -> list[str]:
    return [a["type"] for a in snapshot()["telemetry"]["audit"]]


def test_dispatch_assignment_is_audited_in_dynamodb_by_the_worker():
    snap = snapshot()
    rider = next(r for r in snap["riders"] if r["status"] == "WAITING")
    link = httpx.get(f"{API}/api/riders/{rider['id']}/candidate-links").json()[0]
    a = httpx.post(f"{API}/api/dispatch-assignments", json={"riderId": rider["id"], "driverId": link["driverId"]}).json()
    wait_for(
        lambda: any(e["type"] == "ASSIGNMENT_COMMITTED" and a["id"] in e["detail"] for e in snapshot()["telemetry"]["audit"]),
        20,
        "ASSIGNMENT_COMMITTED audit row",
    )


def test_poison_pill_is_isolated_by_sqs_redrive_and_replay_recovers_it():
    before = snapshot()["telemetry"]["dlqCount"]
    httpx.post(f"{API}/api/chaos/poison-pill").raise_for_status()
    wait_for(lambda: snapshot()["telemetry"]["dlqCount"] == before + 1, 30, "PoisonPill in DLQ")
    t = snapshot()["telemetry"]
    assert t["health"] == "DEGRADED"
    assert "RECEIVE_FAILED" in audit_types() and "DLQ_ISOLATED" in audit_types()

    httpx.post(f"{API}/api/chaos/dlq-replay").raise_for_status()
    wait_for(lambda: snapshot()["telemetry"]["dlqCount"] == 0, 30, "DLQ drained")
    wait_for(lambda: "DLQ_REPLAY_PROCESSED" in audit_types(), 20, "replayed message processed")
    assert snapshot()["telemetry"]["health"] == "HEALTHY"


def test_gps_tick_flows_through_sqs():
    processed = snapshot()["telemetry"]["processed"]
    httpx.post(f"{API}/api/chaos/gps-tick").raise_for_status()
    wait_for(lambda: snapshot()["telemetry"]["processed"] >= processed + 10, 20, "GPS ticks consumed")


def test_sse_stream_sends_snapshot_then_positions():
    events = []
    with httpx.stream("GET", f"{API}/api/stream", timeout=10) as r:
        for line in r.iter_lines():
            if line.startswith("event: "):
                events.append(line[7:])
            if "positions" in events:
                break
    assert events[0] == "snapshot" and "positions" in events

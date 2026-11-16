import json
import time

import pytest
from fastapi.testclient import TestClient

from rideforce.api import DispatchService, create_app

from .conftest import FakeAudit, FakeBus


@pytest.fixture
def harness(sim):
    bus, audit = FakeBus(), FakeAudit()
    svc_holder = {}

    def factory():
        svc = DispatchService(sim, bus, audit)
        svc_holder["svc"] = svc
        return svc

    with TestClient(create_app(factory)) as client:
        yield client, bus, audit, svc_holder["svc"]


def wait_for(fn, timeout=3.0):
    end = time.time() + timeout
    while time.time() < end:
        if fn():
            return
        time.sleep(0.05)
    raise AssertionError("timed out")


def test_snapshot_matches_frontend_contract(harness):
    client, *_ = harness
    snap = client.get("/api/snapshot").json()
    assert set(snap) >= {"version", "drivers", "riders", "assignments", "telemetry", "config"}
    d = snap["drivers"][0]
    assert set(d) >= {"id", "callsign", "name", "seats", "status", "position", "heading"}
    assert set(snap["telemetry"]) >= {"queueDepth", "inFlight", "dlqCount", "dlqMessages", "processed", "auditCount", "audit", "health"}
    assert snap["config"]["maxMatchRadiusKm"] == 2.4


def test_dispatch_assignment_endpoint_publishes_event(harness):
    client, bus, _, _ = harness
    snap = client.get("/api/snapshot").json()
    rider = next(r for r in snap["riders"] if r["status"] == "WAITING")
    link = client.get(f"/api/riders/{rider['id']}/candidate-links").json()[0]
    res = client.post("/api/dispatch-assignments", json={"riderId": rider["id"], "driverId": link["driverId"]})
    assert res.status_code == 201
    assert res.json()["status"] == "EN_ROUTE"
    wait_for(lambda: any(k == "DISPATCH_ASSIGNMENT" and json.loads(b)["id"] == res.json()["id"] for k, b, _ in bus.sent))


def test_dispatch_assignment_conflict_returns_409(harness):
    client, *_ = harness
    snap = client.get("/api/snapshot").json()
    rider = next(r for r in snap["riders"] if r["status"] == "WAITING")
    res = client.post("/api/dispatch-assignments", json={"riderId": rider["id"], "driverId": "drv-108"})
    assert res.status_code == 409


def test_chaos_endpoints_reach_the_bus_and_audit(harness):
    client, bus, audit, _ = harness
    assert client.post("/api/chaos/poison-pill").status_code == 202
    wait_for(lambda: "POISON_PILL_INJECTED" in audit.types())
    assert any(k == "POISON_PILL" for k, _, _ in bus.sent)

    bus.dlq.append({"id": "pp", "kind": "POISON_PILL", "payload": "{}", "malformed": True, "repaired": False, "receiveCount": 3, "enqueuedAt": 0, "visibleAt": 0})
    wait_for(lambda: client.get("/api/snapshot").json()["telemetry"]["health"] == "DEGRADED")
    assert client.post("/api/chaos/dlq-replay").status_code == 202
    wait_for(lambda: "DLQ_REDRIVE" in audit.types())
    wait_for(lambda: client.get("/api/snapshot").json()["telemetry"]["dlqCount"] == 0)

    assert client.post("/api/chaos/gps-tick").status_code == 202
    wait_for(lambda: sum(1 for k, _, _ in bus.sent if k == "GPS_TICK") == 10)


def test_stream_emits_initial_snapshot(harness):
    _, _, _, svc = harness
    # The SSE generator is exercised end-to-end in the integration test; here we check the payload.
    snap = json.loads(svc.snapshot_payload)
    assert snap["drivers"] and snap["version"] >= 0

import json

import pytest

from rideforce.domain import DispatchRules
from rideforce.simulation import DispatchRejected, DispatchSimulation


def run_until(sim: DispatchSimulation, predicate, seconds: float = 30.0) -> None:
    t = 0.0
    while t < seconds:
        sim.tick(1 / 30)
        t += 1 / 30
        if predicate():
            return
    raise AssertionError("condition not reached in simulated time")


def test_seed_state_shows_all_three_driver_states_reachable(sim):
    statuses = {d.status for d in sim.drivers.values()}
    assert statuses == {"AVAILABLE", "EN_ROUTE"}
    waiting = [r for r in sim.riders.values() if r.status == "WAITING"]
    assert len(waiting) == 4
    assert sim.drivers["drv-108"].status == "EN_ROUTE"


def test_seed_is_deterministic(manifest):
    a = DispatchSimulation(manifest, DispatchRules())
    b = DispatchSimulation(manifest, DispatchRules())
    strip = lambda s: [{k: v for k, v in r.items() if k != "requestedAt"} for r in s.fleet_json()["riders"]]
    assert strip(a) == strip(b)


def test_candidate_links_are_top3_available_ranked_by_distance(sim):
    rider = next(r for r in sim.riders.values() if r.status == "WAITING")
    links = sim.candidate_links(rider.id, 3)
    assert [l.rank for l in links] == [1, 2, 3]
    assert [l.distance_km for l in links] == sorted(l.distance_km for l in links)
    assert all(sim.drivers[l.driver_id].status == "AVAILABLE" for l in links)
    assert all(l.eta_min >= 1 for l in links)


def test_candidate_links_respect_ssm_radius(sim):
    tight = sim
    tight.rules.max_match_radius_km = 0.01  # as if SSM were changed at runtime
    rider = next(r for r in tight.riders.values() if r.status == "WAITING")
    assert tight.candidate_links(rider.id) == []


def test_dispatch_assignment_drives_en_route_then_on_trip_then_available(sim):
    rider = next(r for r in sim.riders.values() if r.status == "WAITING")
    link = sim.candidate_links(rider.id, 1)[0]
    sim.outbox.clear()
    a = sim.create_assignment(rider.id, link.driver_id)
    driver = sim.drivers[link.driver_id]
    assert driver.status == "EN_ROUTE" and rider.status == "ASSIGNED"
    assert [e.kind for e in sim.outbox] == ["DISPATCH_ASSIGNMENT"]
    assert json.loads(sim.outbox[0].body)["id"] == a.id

    run_until(sim, lambda: driver.status == "ON_TRIP")
    assert sim.assignments[a.id].status == "ON_TRIP"
    run_until(sim, lambda: driver.status == "AVAILABLE", seconds=60)
    assert sim.assignments[a.id].status == "COMPLETED"
    assert rider.id not in sim.riders
    transitions = [
        t for t in (json.loads(e.body) for e in sim.outbox if e.kind == "STATUS_TRANSITION") if t["id"] == a.id
    ]
    assert [(t["from"], t["to"]) for t in transitions] == [("EN_ROUTE", "ON_TRIP"), ("ON_TRIP", "COMPLETED")]


@pytest.mark.parametrize("bad", ["busy-driver", "missing-rider"])
def test_dispatch_assignment_rejects_invalid_commands(sim, bad):
    rider = next(r for r in sim.riders.values() if r.status == "WAITING")
    with pytest.raises(DispatchRejected):
        if bad == "busy-driver":
            sim.create_assignment(rider.id, "drv-108")
        else:
            sim.create_assignment("rdr-999", "drv-101")


def test_poison_pill_is_marked_malformed(sim):
    sim.outbox.clear()
    sim.inject_poison_pill()
    assert len(sim.outbox) == 1 and sim.outbox[0].malformed


def test_gps_tick_publishes_one_event_per_driver(sim):
    sim.outbox.clear()
    sim.gps_tick()
    assert [e.kind for e in sim.outbox] == ["GPS_TICK"] * len(sim.drivers)
    assert sim.last_gps_tick_at is not None

"""Deterministic DispatchZone fleet simulation.

Pure Python: no AWS calls. Side effects are recorded in `outbox` (events destined for the
SQS dispatch-events queue) and `audit_outbox` (direct DynamoDB audit writes) and drained by
the API process. This keeps the simulation unit-testable without the emulator.
"""

from __future__ import annotations

import json
import math
import random
import time
from dataclasses import dataclass, field
from typing import Any, Literal

from .domain import (
    CandidateLink,
    DispatchAssignment,
    DispatchRules,
    Driver,
    Rider,
    Vec2,
    ZoneManifest,
    rank_candidate_links,
)

DRIVE_SPEED = 7.5  # world units / second
MAX_WAITING_RIDERS = 5
COMPLETED_RETAIN = 12

EventKind = Literal["GPS_TICK", "DISPATCH_ASSIGNMENT", "STATUS_TRANSITION", "POISON_PILL"]
Severity = Literal["info", "warn", "error"]

DRIVER_ROSTER: list[tuple[str, int]] = [
    ("Maya Okafor", 4),
    ("Luis Herrera", 4),
    ("Priya Natarajan", 6),
    ("Tomasz Wójcik", 4),
    ("Aiko Tanaka", 4),
    ("Dev Malhotra", 6),
    ("Sofia Lindqvist", 4),
    ("Kwame Mensah", 4),
    ("Hana Kim", 4),
    ("Mateo Rossi", 4),
]

RIDER_NAMES = [
    "Ava Chen", "Noah Patel", "Zara Ahmed", "Elijah Brooks", "Mina Sato", "Omar Haddad", "Isla Murphy",
    "Ravi Iyer", "Chloe Martin", "Felix Wagner", "Leila Nasser", "Jonah Reyes", "Ines Duarte", "Kai Nakamura",
]

POISON_PILL_BODY = '{"type":"DispatchAssignment","riderId":null,"driverId":"\\u0000","eta":"NaN","schema":"v0"}'


class DispatchRejected(Exception):
    """A DispatchAssignment command violated a domain invariant."""


@dataclass
class Live:
    x: float
    z: float
    heading: float
    mode: Literal["parked", "cruising", "driving"]
    path: list[Vec2] = field(default_factory=list)
    slot: int | None = None

    @property
    def pos(self) -> Vec2:
        return Vec2(self.x, self.z)


@dataclass
class OutboundEvent:
    kind: EventKind
    body: str
    malformed: bool = False


@dataclass
class AuditRecord:
    type: str
    detail: str
    severity: Severity = "info"


def now_ms() -> int:
    return int(time.time() * 1000)


class DispatchSimulation:
    def __init__(self, manifest: ZoneManifest, rules: DispatchRules, seed: int = 9297) -> None:
        self.manifest = manifest
        self.rules = rules
        self.seed = seed
        self.outbox: list[OutboundEvent] = []
        self.audit_outbox: list[AuditRecord] = []
        self.last_gps_tick_at: int | None = None
        self.bootstrap()

    # ------------------------------------------------------------------ lifecycle

    def bootstrap(self) -> None:
        self.rng = random.Random(self.seed)
        self.drivers: dict[str, Driver] = {}
        self.riders: dict[str, Rider] = {}
        self.assignments: dict[str, DispatchAssignment] = {}
        self.live: dict[str, Live] = {}
        self.rider_seq = 0
        self.assignment_seq = 0
        self.last_gps_tick_at = None

        m = self.manifest
        parked_slots = [0, 2, 4, 7, 9, 13]
        cruisers = [
            Vec2(-25, m.corridor_lane_z),
            Vec2(-7, m.corridor_lane_z),
            Vec2(4, m.curb_lane_z),
            Vec2(26, m.corridor_lane_z),
        ]
        for i, (name, seats) in enumerate(DRIVER_ROSTER):
            did = f"drv-{101 + i}"
            if i < len(parked_slots):
                slot = parked_slots[i]
                p = m.staging_slots[slot]
                live = Live(p.x, p.z, math.pi, "parked", slot=slot)
            else:
                p = cruisers[i - len(parked_slots)]
                live = Live(p.x, p.z, math.pi / 2 if i % 2 else -math.pi / 2, "cruising")
            self.live[did] = live
            self.drivers[did] = Driver(did, f"RF-{101 + i}", name, seats)

        for door in (0, 1, 2, 4):
            self._add_rider(door)
        in_flight = self._add_rider(3)
        self._assign(in_flight.id, "drv-108")
        self._audit("ZONE_ONLINE", f"{m.name} DispatchZone online · {len(self.drivers)} Drivers")

    # ------------------------------------------------------------------ queries

    def position_of(self, driver: Driver) -> Vec2:
        return self.live[driver.id].pos

    def candidate_links(self, rider_id: str, limit: int = 3) -> list[CandidateLink]:
        rider = self.riders.get(rider_id)
        if not rider:
            return []
        return rank_candidate_links(rider, list(self.drivers.values()), self.position_of, self.rules, limit)

    def fleet_json(self) -> dict[str, Any]:
        assignments = sorted(self.assignments.values(), key=lambda a: a.created_at, reverse=True)
        return {
            "drivers": [d.to_json(self.live[d.id].pos, self.live[d.id].heading) for d in self.drivers.values()],
            "riders": [r.to_json() for r in self.riders.values()],
            "assignments": [a.to_json() for a in assignments],
        }

    def positions_json(self) -> dict[str, list[float]]:
        return {did: [round(l.x, 3), round(l.z, 3), round(l.heading, 4)] for did, l in self.live.items()}

    # ------------------------------------------------------------------ commands

    def create_assignment(self, rider_id: str, driver_id: str) -> DispatchAssignment:
        return self._assign(rider_id, driver_id)

    def gps_tick(self) -> None:
        ts = now_ms()
        for d in self.drivers.values():
            live = self.live[d.id]
            if live.mode == "cruising":
                nx = max(-30.0, min(30.0, live.x + (self.rng.random() - 0.5) * 9))
                live.heading = math.pi / 2 if nx >= live.x else -math.pi / 2
                live.x = nx
            self._emit("GPS_TICK", {"driverId": d.id, "x": round(live.x, 2), "z": round(live.z, 2), "ts": ts})
        self.last_gps_tick_at = ts
        self._audit("GPS_TICK_PUBLISHED", f"{len(self.drivers)} Driver positions published to dispatch-events")

    def inject_poison_pill(self) -> None:
        self.outbox.append(OutboundEvent("POISON_PILL", POISON_PILL_BODY, malformed=True))

    def reset(self) -> None:
        self.outbox.clear()
        self.bootstrap()
        self._audit("FLEET_RESET", "Showcase fleet restored to seed state")

    # ------------------------------------------------------------------ time

    def tick(self, dt: float) -> bool:
        """Advance driving Drivers; returns True when a discrete state change happened."""
        dt = min(dt, 0.1)
        changed = False
        for driver in self.drivers.values():
            live = self.live[driver.id]
            if live.mode != "driving" or not live.path:
                continue
            budget = DRIVE_SPEED * dt
            while budget > 0 and live.path:
                target = live.path[0]
                dx, dz = target.x - live.x, target.z - live.z
                dist = math.hypot(dx, dz)
                if dist > 1e-4:
                    live.heading = math.atan2(dx, dz)
                if dist <= budget:
                    live.x, live.z = target.x, target.z
                    live.path.pop(0)
                    budget -= dist
                else:
                    live.x += dx / dist * budget
                    live.z += dz / dist * budget
                    budget = 0
            if not live.path:
                changed = self._on_arrival(driver, live) or changed
        return changed

    def maybe_spawn_rider(self) -> bool:
        waiting = [r for r in self.riders.values() if r.status == "WAITING"]
        if len(waiting) >= MAX_WAITING_RIDERS:
            return False
        occupied = {r.pickup_label for r in self.riders.values() if r.status != "PICKED_UP"}
        free = [i for i, p in enumerate(self.manifest.pickup_points) if p.label not in occupied]
        if not free:
            return False
        rider = self._add_rider(self.rng.choice(free))
        rider.requested_at = now_ms()
        self._audit("RIDER_REQUESTED", f"{rider.name} waiting at {rider.pickup_label} → {rider.destination}")
        return True

    # ------------------------------------------------------------------ internals

    def _add_rider(self, door_index: int) -> Rider:
        door = self.manifest.pickup_points[door_index]
        dest = self.manifest.destinations[int(self.rng.random() * len(self.manifest.destinations))]
        n = self.rider_seq
        self.rider_seq += 1
        party = 5 if self.rng.random() < 0.12 else 1 + int(self.rng.random() * 3)
        rider = Rider(
            id=f"rdr-{n + 1:03d}",
            name=RIDER_NAMES[n % len(RIDER_NAMES)],
            party_size=party,
            pickup=Vec2(door.x + (self.rng.random() - 0.5) * 1.2, door.z),
            pickup_label=door.label,
            destination=dest.label,
            requested_at=now_ms() - int(self.rng.random() * 120_000),
        )
        self.riders[rider.id] = rider
        return rider

    def _assign(self, rider_id: str, driver_id: str) -> DispatchAssignment:
        rider = self.riders.get(rider_id)
        driver = self.drivers.get(driver_id)
        if not rider or rider.status != "WAITING":
            raise DispatchRejected(f"Rider {rider_id} is not waiting")
        if not driver or driver.status != "AVAILABLE":
            raise DispatchRejected(f"Driver {driver_id} is not AVAILABLE")
        if driver.seats < rider.party_size:
            raise DispatchRejected(f"Driver {driver_id} has {driver.seats} seats; Rider party is {rider.party_size}")
        live = self.live[driver_id]
        km = round(math.hypot(live.x - rider.pickup.x, live.z - rider.pickup.z) * self.rules.unit_km * 100) / 100
        if km > self.rules.max_match_radius_km:
            raise DispatchRejected(f"Driver {driver_id} is {km} km away; max match radius is {self.rules.max_match_radius_km} km")

        self.assignment_seq += 1
        a = DispatchAssignment(
            id=f"DA-{self.assignment_seq:04d}",
            rider_id=rider_id,
            rider_name=rider.name,
            driver_id=driver_id,
            driver_callsign=driver.callsign,
            distance_km=km,
            eta_min=self.rules.eta_minutes(km),
            created_at=now_ms(),
        )
        self.assignments[a.id] = a
        driver.status, driver.rider_id, driver.assignment_id = "EN_ROUTE", rider_id, a.id
        rider.status, rider.assigned_driver_id = "ASSIGNED", driver_id

        m = self.manifest
        stop = Vec2(rider.pickup.x, m.curb_lane_z)
        on_curb = abs(live.z - m.curb_lane_z) < 0.5
        raw = [stop] if on_curb else [Vec2(live.x, m.corridor_lane_z), Vec2(stop.x, m.corridor_lane_z), stop]
        live.path = _dedupe(raw, live.pos)
        live.mode, live.slot = "driving", None

        self._emit(
            "DISPATCH_ASSIGNMENT",
            {
                "id": a.id,
                "riderId": rider_id,
                "riderName": rider.name,
                "driverId": driver_id,
                "driverCallsign": driver.callsign,
                "distanceKm": a.distance_km,
                "etaMin": a.eta_min,
            },
        )
        return a

    def _on_arrival(self, driver: Driver, live: Live) -> bool:
        a = self.assignments.get(driver.assignment_id or "")
        rider = self.riders.get(driver.rider_id or "")
        if not a:
            return False
        m = self.manifest
        if driver.status == "EN_ROUTE":
            driver.status = "ON_TRIP"
            a.status, a.picked_up_at = "ON_TRIP", now_ms()
            dest = next((d for d in m.destinations if rider and d.label == rider.destination), m.destinations[0])
            if rider:
                rider.status = "PICKED_UP"
            live.path = [Vec2(live.x + (2 if dest.exit == "east" else -2), m.corridor_lane_z), m.exits[dest.exit]]
            self._transition(a, "EN_ROUTE", "ON_TRIP")
            return True
        if driver.status == "ON_TRIP":
            a.status, a.completed_at = "COMPLETED", now_ms()
            if rider:
                del self.riders[rider.id]
            driver.status, driver.rider_id, driver.assignment_id = "AVAILABLE", None, None
            slot = self._free_slot()
            p = m.staging_slots[slot]
            live.x, live.z, live.heading, live.path, live.mode, live.slot = p.x, p.z, math.pi, [], "parked", slot
            self._transition(a, "ON_TRIP", "COMPLETED")
            self._prune()
            return True
        return False

    def _transition(self, a: DispatchAssignment, frm: str, to: str) -> None:
        self._emit(
            "STATUS_TRANSITION",
            {"id": a.id, "driverCallsign": a.driver_callsign, "riderName": a.rider_name, "from": frm, "to": to},
        )

    def _free_slot(self) -> int:
        taken = {l.slot for l in self.live.values() if l.slot is not None}
        free = [i for i in range(len(self.manifest.staging_slots)) if i not in taken]
        return self.rng.choice(free) if free else 0

    def _prune(self) -> None:
        done = sorted((a for a in self.assignments.values() if a.status == "COMPLETED"), key=lambda a: a.created_at)
        for a in done[: max(0, len(done) - COMPLETED_RETAIN)]:
            del self.assignments[a.id]

    def _emit(self, kind: EventKind, body: dict[str, Any]) -> None:
        self.outbox.append(OutboundEvent(kind, json.dumps(body, ensure_ascii=False)))

    def _audit(self, type_: str, detail: str, severity: Severity = "info") -> None:
        self.audit_outbox.append(AuditRecord(type_, detail, severity))


def _dedupe(points: list[Vec2], start: Vec2) -> list[Vec2]:
    out: list[Vec2] = []
    prev = start
    for p in points:
        if math.hypot(p.x - prev.x, p.z - prev.z) > 0.05:
            out.append(p)
            prev = p
    return out

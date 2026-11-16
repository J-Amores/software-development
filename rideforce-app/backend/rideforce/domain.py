"""Domain model for the Airport Corridor DispatchZone (vocabulary per GLOSSARY.md).

Wire format is camelCase JSON so it matches the frontend's DispatchSnapshot contract.
"""

from __future__ import annotations

import json
import math
from dataclasses import dataclass, field
from importlib import resources
from typing import Any, Literal

DriverStatus = Literal["AVAILABLE", "EN_ROUTE", "ON_TRIP"]
RiderStatus = Literal["WAITING", "ASSIGNED", "PICKED_UP"]
AssignmentStatus = Literal["EN_ROUTE", "ON_TRIP", "COMPLETED"]


@dataclass(frozen=True)
class Vec2:
    x: float
    z: float

    def to_json(self) -> dict[str, float]:
        return {"x": round(self.x, 3), "z": round(self.z, 3)}


@dataclass(frozen=True)
class PickupPoint:
    label: str
    x: float
    z: float


@dataclass(frozen=True)
class Destination:
    label: str
    exit: Literal["east", "west"]


@dataclass(frozen=True)
class ZoneManifest:
    """Spatial manifest for a DispatchZone (stored in S3, see ADR-0002)."""

    id: str
    name: str
    unit_km: float
    avg_speed_kmh: float
    curb_lane_z: float
    corridor_lane_z: float
    pickup_points: tuple[PickupPoint, ...]
    staging_slots: tuple[Vec2, ...]
    exits: dict[str, Vec2]
    destinations: tuple[Destination, ...]

    @classmethod
    def from_json(cls, raw: str | bytes) -> ZoneManifest:
        d = json.loads(raw)
        return cls(
            id=d["id"],
            name=d["name"],
            unit_km=float(d["unitKm"]),
            avg_speed_kmh=float(d["avgSpeedKmh"]),
            curb_lane_z=float(d["curbLaneZ"]),
            corridor_lane_z=float(d["corridorLaneZ"]),
            pickup_points=tuple(PickupPoint(p["label"], p["x"], p["z"]) for p in d["pickupPoints"]),
            staging_slots=tuple(Vec2(s["x"], s["z"]) for s in d["stagingSlots"]),
            exits={k: Vec2(v["x"], v["z"]) for k, v in d["exits"].items()},
            destinations=tuple(Destination(x["label"], x["exit"]) for x in d["destinations"]),
        )

    @classmethod
    def bundled(cls) -> ZoneManifest:
        return cls.from_json(resources.files("rideforce").joinpath("zone_manifest.json").read_bytes())


@dataclass
class Driver:
    id: str
    callsign: str
    name: str
    seats: int
    status: DriverStatus = "AVAILABLE"
    rider_id: str | None = None
    assignment_id: str | None = None

    def to_json(self, pos: Vec2, heading: float) -> dict[str, Any]:
        out: dict[str, Any] = {
            "id": self.id,
            "callsign": self.callsign,
            "name": self.name,
            "seats": self.seats,
            "status": self.status,
            "position": pos.to_json(),
            "heading": round(heading, 4),
        }
        if self.rider_id:
            out["riderId"] = self.rider_id
        if self.assignment_id:
            out["assignmentId"] = self.assignment_id
        return out


@dataclass
class Rider:
    id: str
    name: str
    party_size: int
    pickup: Vec2
    pickup_label: str
    destination: str
    requested_at: int
    status: RiderStatus = "WAITING"
    assigned_driver_id: str | None = None

    def to_json(self) -> dict[str, Any]:
        out: dict[str, Any] = {
            "id": self.id,
            "name": self.name,
            "partySize": self.party_size,
            "pickup": self.pickup.to_json(),
            "pickupLabel": self.pickup_label,
            "destination": self.destination,
            "status": self.status,
            "requestedAt": self.requested_at,
        }
        if self.assigned_driver_id:
            out["assignedDriverId"] = self.assigned_driver_id
        return out


@dataclass
class DispatchAssignment:
    id: str
    rider_id: str
    rider_name: str
    driver_id: str
    driver_callsign: str
    distance_km: float
    eta_min: int
    created_at: int
    status: AssignmentStatus = "EN_ROUTE"
    picked_up_at: int | None = None
    completed_at: int | None = None

    def to_json(self) -> dict[str, Any]:
        out: dict[str, Any] = {
            "id": self.id,
            "riderId": self.rider_id,
            "riderName": self.rider_name,
            "driverId": self.driver_id,
            "driverCallsign": self.driver_callsign,
            "status": self.status,
            "distanceKm": self.distance_km,
            "etaMin": self.eta_min,
            "createdAt": self.created_at,
        }
        if self.picked_up_at is not None:
            out["pickedUpAt"] = self.picked_up_at
        if self.completed_at is not None:
            out["completedAt"] = self.completed_at
        return out


@dataclass(frozen=True)
class CandidateLink:
    rider_id: str
    driver_id: str
    rank: int
    distance_km: float
    eta_min: int

    def to_json(self) -> dict[str, Any]:
        return {
            "riderId": self.rider_id,
            "driverId": self.driver_id,
            "rank": self.rank,
            "distanceKm": self.distance_km,
            "etaMin": self.eta_min,
        }


@dataclass
class DispatchRules:
    """Tunable dispatch policy (max match radius is read from SSM Parameter Store)."""

    max_match_radius_km: float = 2.4
    unit_km: float = 0.04
    avg_speed_kmh: float = 28.0
    extra: dict[str, Any] = field(default_factory=dict)

    def eta_minutes(self, km: float) -> int:
        return max(1, round((km / self.avg_speed_kmh) * 60 + 0.5))


def rank_candidate_links(
    rider: Rider,
    drivers: list[Driver],
    position_of: Any,
    rules: DispatchRules,
    limit: int = 3,
) -> list[CandidateLink]:
    """Nearest AVAILABLE Drivers with enough seats inside the max match radius."""
    if rider.status != "WAITING":
        return []
    scored: list[tuple[float, Driver]] = []
    for d in drivers:
        if d.status != "AVAILABLE" or d.seats < rider.party_size:
            continue
        p: Vec2 = position_of(d)
        km = math.hypot(p.x - rider.pickup.x, p.z - rider.pickup.z) * rules.unit_km
        km = round(km * 100) / 100
        if km <= rules.max_match_radius_km:
            scored.append((km, d))
    scored.sort(key=lambda t: t[0])
    return [
        CandidateLink(rider.id, d.id, i + 1, km, rules.eta_minutes(km))
        for i, (km, d) in enumerate(scored[:limit])
    ]

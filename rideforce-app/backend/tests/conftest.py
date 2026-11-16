from __future__ import annotations

from typing import Any

import pytest

from rideforce.domain import DispatchRules, ZoneManifest
from rideforce.simulation import DispatchSimulation


class FakeBus:
    def __init__(self) -> None:
        self.sent: list[tuple[str, str, bool]] = []
        self.dlq: list[dict[str, Any]] = []
        self.purged = 0

    def publish(self, kind: str, body: str, repaired: bool = False) -> str:
        self.sent.append((kind, body, repaired))
        return f"msg-{len(self.sent):08d}-fake"

    def publish_batch(self, events: list[tuple[str, str]]) -> None:
        self.sent.extend((k, b, False) for k, b in events)

    def queue_depths(self) -> tuple[int, int, int]:
        return (0, 0, len(self.dlq))

    def peek_dlq(self) -> list[dict[str, Any]]:
        return list(self.dlq)

    def redrive_dlq(self) -> int:
        n = len(self.dlq)
        self.dlq.clear()
        return n

    def purge(self) -> None:
        self.purged += 1


class FakeAudit:
    def __init__(self) -> None:
        self.rows: list[tuple[str, str, str]] = []
        self.processed_n = 0

    def write(self, type_: str, detail: str, severity: str = "info") -> None:
        self.rows.append((type_, detail, severity))

    def increment_processed(self) -> None:
        self.processed_n += 1

    def recent(self, limit: int = 60) -> list[dict[str, Any]]:
        return [
            {"id": str(i), "at": i, "type": t, "detail": d, "severity": s}
            for i, (t, d, s) in reversed(list(enumerate(self.rows)))
        ][:limit]

    def count(self) -> int:
        return len(self.rows)

    def processed(self) -> int:
        return self.processed_n

    def types(self) -> list[str]:
        return [t for t, _, _ in self.rows]


@pytest.fixture
def manifest() -> ZoneManifest:
    return ZoneManifest.bundled()


@pytest.fixture
def sim(manifest: ZoneManifest) -> DispatchSimulation:
    return DispatchSimulation(manifest, DispatchRules(2.4, manifest.unit_km, manifest.avg_speed_kmh))

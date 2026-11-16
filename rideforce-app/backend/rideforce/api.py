"""FastAPI dispatch API: the server side of HttpDispatchAdapter (ADR-0001)."""

from __future__ import annotations

import asyncio
import json
import logging
import time
from collections.abc import AsyncIterator, Callable
from contextlib import asynccontextmanager
from typing import Any, Protocol

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from .simulation import DispatchRejected, DispatchSimulation

log = logging.getLogger("rideforce.api")

SIM_HZ = 30
POSITION_EVERY_N_TICKS = 3  # ~10 Hz position stream
TELEMETRY_INTERVAL_S = 1.0
RIDER_SPAWN_S = 9.0
AUDIT_WINDOW = 60
MAX_RECEIVE_COUNT = 3


class EventBusPort(Protocol):
    def publish(self, kind: str, body: str, repaired: bool = False) -> str: ...
    def publish_batch(self, events: list[tuple[str, str]]) -> None: ...
    def queue_depths(self) -> tuple[int, int, int]: ...
    def peek_dlq(self) -> list[dict[str, Any]]: ...
    def redrive_dlq(self) -> int: ...
    def purge(self) -> None: ...


class AuditPort(Protocol):
    def write(self, type_: str, detail: str, severity: str = "info") -> None: ...
    def recent(self, limit: int = 60) -> list[dict[str, Any]]: ...
    def count(self) -> int: ...
    def processed(self) -> int: ...


def empty_telemetry() -> dict[str, Any]:
    return {
        "queueDepth": 0,
        "inFlight": 0,
        "dlqCount": 0,
        "dlqMessages": [],
        "processed": 0,
        "maxReceiveCount": MAX_RECEIVE_COUNT,
        "auditCount": 0,
        "audit": [],
        "health": "HEALTHY",
    }


class DispatchService:
    """Owns the simulation, the outbound I/O queue and SSE subscribers. Runs on one event loop."""

    def __init__(self, sim: DispatchSimulation, bus: EventBusPort, audit: AuditPort, zone_id: str = "airport-corridor") -> None:
        self.sim = sim
        self.bus = bus
        self.audit = audit
        self.zone_id = zone_id
        self.version = 0
        self.telemetry = empty_telemetry()
        self.telemetry_ok = False
        self.subscribers: set[asyncio.Queue[tuple[str, str]]] = set()
        self.io: asyncio.Queue[Callable[[], Any]] = asyncio.Queue()
        self.telemetry_now = asyncio.Event()
        self._snapshot_payload = ""
        self._tasks: list[asyncio.Task[Any]] = []
        self._rebuild_snapshot()

    # ---------------------------------------------------------------- snapshot + SSE

    def snapshot(self) -> dict[str, Any]:
        return {
            "version": self.version,
            **self.sim.fleet_json(),
            "telemetry": {**self.telemetry, "lastGpsTickAt": self.sim.last_gps_tick_at},
            "config": {"zoneId": self.zone_id, "maxMatchRadiusKm": self.sim.rules.max_match_radius_km},
        }

    def _rebuild_snapshot(self) -> None:
        self._snapshot_payload = json.dumps(self.snapshot(), ensure_ascii=False, separators=(",", ":"))

    @property
    def snapshot_payload(self) -> str:
        return self._snapshot_payload

    def publish_snapshot(self) -> None:
        self.version += 1
        self._rebuild_snapshot()
        self._broadcast("snapshot", self._snapshot_payload)

    def _broadcast(self, event: str, data: str) -> None:
        for q in list(self.subscribers):
            if q.full():
                try:
                    q.get_nowait()
                except asyncio.QueueEmpty:
                    pass
            q.put_nowait((event, data))

    def subscribe(self) -> asyncio.Queue[tuple[str, str]]:
        q: asyncio.Queue[tuple[str, str]] = asyncio.Queue(maxsize=64)
        self.subscribers.add(q)
        return q

    def unsubscribe(self, q: asyncio.Queue[tuple[str, str]]) -> None:
        self.subscribers.discard(q)

    # ---------------------------------------------------------------- side effects

    def flush_outbox(self) -> None:
        events, self.sim.outbox = self.sim.outbox, []
        audits, self.sim.audit_outbox = self.sim.audit_outbox, []
        normal = [(e.kind, e.body) for e in events if not e.malformed]
        if normal:
            self.io.put_nowait(lambda: self.bus.publish_batch(normal))
        for e in (e for e in events if e.malformed):
            self.io.put_nowait(lambda e=e: self._publish_poison(e.kind, e.body))
        for a in audits:
            self.io.put_nowait(lambda a=a: self.audit.write(a.type, a.detail, a.severity))
        if events or audits:
            self.io.put_nowait(self.telemetry_now.set)

    def _publish_poison(self, kind: str, body: str) -> None:
        msg_id = self.bus.publish(kind, body)
        self.audit.write(
            "POISON_PILL_INJECTED",
            f"{msg_id[:12]} enqueued with malformed schema (maxReceiveCount={MAX_RECEIVE_COUNT})",
            "warn",
        )

    def _replay(self) -> None:
        moved = self.bus.redrive_dlq()
        if moved:
            self.audit.write("DLQ_REDRIVE", f"{moved} message(s) redriven to dispatch-events with schema v2 repair")
        else:
            self.audit.write("DLQ_REDRIVE_SKIPPED", "DLQ empty — nothing to redrive")

    def _read_telemetry(self) -> dict[str, Any]:
        depth, in_flight, dlq = self.bus.queue_depths()
        dlq_msgs = self.bus.peek_dlq() if dlq else []
        return {
            "queueDepth": depth,
            "inFlight": in_flight,
            "dlqCount": dlq,
            "dlqMessages": dlq_msgs,
            "processed": self.audit.processed(),
            "maxReceiveCount": MAX_RECEIVE_COUNT,
            "auditCount": self.audit.count(),
            "audit": self.audit.recent(AUDIT_WINDOW),
            "health": "DEGRADED" if dlq else "HEALTHY",
        }

    # ---------------------------------------------------------------- commands

    def command(self, fn: Callable[[], Any]) -> Any:
        result = fn()
        self.flush_outbox()
        self.publish_snapshot()
        return result

    def dispatch(self, rider_id: str, driver_id: str) -> dict[str, Any]:
        return self.command(lambda: self.sim.create_assignment(rider_id, driver_id)).to_json()

    def gps_tick(self) -> None:
        self.command(self.sim.gps_tick)

    def poison_pill(self) -> None:
        self.command(self.sim.inject_poison_pill)

    def replay_dlq(self) -> None:
        self.io.put_nowait(self._replay)
        self.io.put_nowait(self.telemetry_now.set)

    def reset(self) -> None:
        self.io.put_nowait(self.bus.purge)
        self.command(self.sim.reset)

    # ---------------------------------------------------------------- loops

    def start(self) -> None:
        self.flush_outbox()
        loop = asyncio.get_running_loop()
        self._tasks = [
            loop.create_task(self._io_loop(), name="io"),
            loop.create_task(self._sim_loop(), name="sim"),
            loop.create_task(self._spawn_loop(), name="spawn"),
            loop.create_task(self._telemetry_loop(), name="telemetry"),
        ]

    async def stop(self) -> None:
        for t in self._tasks:
            t.cancel()
        await asyncio.gather(*self._tasks, return_exceptions=True)

    async def _io_loop(self) -> None:
        while True:
            job = await self.io.get()
            try:
                await asyncio.to_thread(job)
            except Exception:  # keep the loop alive; surface in logs
                log.exception("outbound I/O failed")

    async def _sim_loop(self) -> None:
        last = time.perf_counter()
        n = 0
        while True:
            await asyncio.sleep(1 / SIM_HZ)
            now = time.perf_counter()
            if self.sim.tick(now - last):
                self.flush_outbox()
                self.publish_snapshot()
            last = now
            n += 1
            if n % POSITION_EVERY_N_TICKS == 0 and self.subscribers:
                self._broadcast("positions", json.dumps(self.sim.positions_json(), separators=(",", ":")))

    async def _spawn_loop(self) -> None:
        while True:
            await asyncio.sleep(RIDER_SPAWN_S)
            if self.sim.maybe_spawn_rider():
                self.flush_outbox()
                self.publish_snapshot()

    async def _telemetry_loop(self) -> None:
        while True:
            try:
                await asyncio.wait_for(self.telemetry_now.wait(), TELEMETRY_INTERVAL_S)
            except TimeoutError:
                pass
            self.telemetry_now.clear()
            try:
                t = await asyncio.to_thread(self._read_telemetry)
                self.telemetry_ok = True
            except Exception:
                log.exception("telemetry read failed")
                self.telemetry_ok = False
                continue
            if t != self.telemetry:
                self.telemetry = t
                self.publish_snapshot()


# -------------------------------------------------------------------- HTTP surface


class DispatchAssignmentRequest(BaseModel):
    riderId: str
    driverId: str


def _build_from_aws() -> DispatchService:
    from .aws import DynamoAuditStore, Settings, SqsEventBus, load_manifest, load_rules

    settings = Settings()
    last: Exception | None = None
    for _ in range(30):  # the emulator and Terraform may still be settling
        try:
            manifest = load_manifest(settings)
            rules = load_rules(settings, manifest)
            sim = DispatchSimulation(manifest, rules)
            return DispatchService(sim, SqsEventBus(settings), DynamoAuditStore(settings), settings.zone_id)
        except Exception as e:  # noqa: BLE001
            last = e
            log.warning("waiting for AWS resources: %s", e)
            time.sleep(2)
    raise RuntimeError("AWS resources unavailable") from last


def create_app(service_factory: Callable[[], DispatchService] = _build_from_aws) -> FastAPI:
    @asynccontextmanager
    async def lifespan(app: FastAPI) -> AsyncIterator[None]:
        svc = await asyncio.to_thread(service_factory)
        app.state.svc = svc
        svc.start()
        yield
        await svc.stop()

    app = FastAPI(title="RideForce Dispatch API", version="0.2.0", lifespan=lifespan)

    def svc(request: Request) -> DispatchService:
        return request.app.state.svc

    @app.get("/healthz")
    def healthz(request: Request) -> dict[str, Any]:
        s = svc(request)
        return {"status": "ok", "telemetry": "ok" if s.telemetry_ok else "pending", "version": s.version}

    @app.get("/api/snapshot")
    def snapshot(request: Request) -> dict[str, Any]:
        return svc(request).snapshot()

    @app.get("/api/riders/{rider_id}/candidate-links")
    def candidate_links(rider_id: str, request: Request, limit: int = 3) -> list[dict[str, Any]]:
        s = svc(request)
        if rider_id not in s.sim.riders:
            raise HTTPException(404, f"Rider {rider_id} not found")
        return [l.to_json() for l in s.sim.candidate_links(rider_id, limit)]

    @app.post("/api/dispatch-assignments", status_code=201)
    def create_dispatch_assignment(body: DispatchAssignmentRequest, request: Request) -> dict[str, Any]:
        try:
            return svc(request).dispatch(body.riderId, body.driverId)
        except DispatchRejected as e:
            raise HTTPException(409, str(e)) from e

    @app.post("/api/chaos/gps-tick", status_code=202)
    def gps_tick(request: Request) -> dict[str, str]:
        svc(request).gps_tick()
        return {"status": "accepted"}

    @app.post("/api/chaos/poison-pill", status_code=202)
    def poison_pill(request: Request) -> dict[str, str]:
        svc(request).poison_pill()
        return {"status": "accepted"}

    @app.post("/api/chaos/dlq-replay", status_code=202)
    def dlq_replay(request: Request) -> dict[str, str]:
        svc(request).replay_dlq()
        return {"status": "accepted"}

    @app.post("/api/fleet/reset", status_code=202)
    def reset(request: Request) -> dict[str, str]:
        svc(request).reset()
        return {"status": "accepted"}

    @app.get("/api/stream")
    async def stream(request: Request) -> StreamingResponse:
        s = svc(request)
        q = s.subscribe()

        async def gen() -> AsyncIterator[str]:
            try:
                yield "retry: 2000\n\n"
                yield f"event: snapshot\ndata: {s.snapshot_payload}\n\n"
                while not await request.is_disconnected():
                    try:
                        event, data = await asyncio.wait_for(q.get(), 15)
                    except TimeoutError:
                        yield ": keepalive\n\n"
                        continue
                    yield f"event: {event}\ndata: {data}\n\n"
            finally:
                s.unsubscribe(q)

        return StreamingResponse(
            gen(),
            media_type="text/event-stream",
            headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
        )

    return app


def app() -> FastAPI:  # uvicorn --factory rideforce.api:app
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s %(message)s")
    return create_app()

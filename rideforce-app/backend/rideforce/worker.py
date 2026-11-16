"""dispatch-events consumer.

Validates each message's schema, writes the DynamoDB dispatch audit, and deletes it. A message
that fails validation is *not* deleted: SQS makes it visible again after the visibility timeout,
and the queue's redrive policy moves it to dispatch-events-dlq after maxReceiveCount receives.
The worker never moves messages itself — DLQ isolation is the queue's job.
"""

from __future__ import annotations

import json
import logging
import signal
import time
from dataclasses import dataclass
from typing import Any, Protocol

log = logging.getLogger("rideforce.worker")

MAX_RECEIVE_COUNT = 3


class SchemaError(ValueError):
    pass


def _require(body: dict[str, Any], key: str, typ: type | tuple[type, ...]) -> Any:
    v = body.get(key)
    if not isinstance(v, typ) or (isinstance(v, str) and (not v or "\x00" in v)):
        raise SchemaError(f"field {key!r} missing or invalid")
    return v


def validate(kind: str, raw: str) -> dict[str, Any]:
    """Return the parsed body or raise SchemaError."""
    try:
        body = json.loads(raw)
    except json.JSONDecodeError as e:
        raise SchemaError(f"invalid JSON: {e.msg}") from e
    if not isinstance(body, dict):
        raise SchemaError("body must be an object")
    if kind == "GPS_TICK":
        _require(body, "driverId", str)
        _require(body, "x", (int, float))
        _require(body, "z", (int, float))
    elif kind == "DISPATCH_ASSIGNMENT":
        for k in ("id", "riderId", "driverId", "driverCallsign", "riderName"):
            _require(body, k, str)
        eta = _require(body, "etaMin", (int, float))
        if eta != eta or eta < 0:  # NaN / negative
            raise SchemaError("etaMin out of range")
    elif kind == "STATUS_TRANSITION":
        for k in ("id", "from", "to"):
            _require(body, k, str)
    else:
        raise SchemaError(f"unknown event kind {kind!r}")
    return body


class AuditSink(Protocol):
    def write(self, type_: str, detail: str, severity: str = "info") -> None: ...
    def increment_processed(self) -> None: ...


@dataclass
class Outcome:
    delete: bool


def handle(kind: str, body: str, receive_count: int, repaired: bool, msg_id: str, audit: AuditSink) -> Outcome:
    """Process one message. Pure apart from the audit sink, so it is unit-testable."""
    short = msg_id[:12]
    if kind == "POISON_PILL" and repaired:
        audit.increment_processed()
        audit.write("DLQ_REPLAY_PROCESSED", f"{short} re-processed after schema repair")
        return Outcome(delete=True)
    try:
        if kind == "POISON_PILL":
            raise SchemaError("PoisonPill payload")
        data = validate(kind, body)
    except SchemaError as e:
        if receive_count >= MAX_RECEIVE_COUNT:
            audit.write("DLQ_ISOLATED", f"{short} exhausted {receive_count} receives → dispatch-events-dlq ({e})", "error")
        else:
            audit.write("RECEIVE_FAILED", f"{short} schema validation failed (receive {receive_count}/{MAX_RECEIVE_COUNT})", "warn")
        return Outcome(delete=False)

    audit.increment_processed()
    if kind == "DISPATCH_ASSIGNMENT":
        audit.write("ASSIGNMENT_COMMITTED", f"{data['id']} · {data['driverCallsign']} → {data['riderName']}")
    elif kind == "STATUS_TRANSITION":
        audit.write("STATUS_TRANSITION", f"{data['id']} · {data.get('driverCallsign', '')} {data['from']} → {data['to']}")
    return Outcome(delete=True)


def run() -> None:  # pragma: no cover - exercised by the compose integration test
    from .aws import DynamoAuditStore, Settings, client

    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s %(message)s")
    settings = Settings()
    sqs = client("sqs")
    for attempt in range(30):
        try:
            queue_url = sqs.get_queue_url(QueueName=settings.queue_name)["QueueUrl"]
            break
        except Exception as e:  # noqa: BLE001
            log.warning("waiting for %s: %s", settings.queue_name, e)
            time.sleep(2)
    else:
        raise SystemExit("dispatch-events queue unavailable")
    audit = DynamoAuditStore(settings)

    running = True

    def stop(*_: Any) -> None:
        nonlocal running
        running = False

    signal.signal(signal.SIGTERM, stop)
    signal.signal(signal.SIGINT, stop)
    log.info("consuming %s", queue_url)

    while running:
        try:
            r = sqs.receive_message(
                QueueUrl=queue_url,
                MaxNumberOfMessages=10,
                WaitTimeSeconds=2,
                AttributeNames=["ApproximateReceiveCount"],
                MessageAttributeNames=["All"],
            )
        except Exception:
            log.exception("receive failed")
            time.sleep(1)
            continue
        for m in r.get("Messages", []):
            attrs = m.get("MessageAttributes", {})
            kind = attrs.get("kind", {}).get("StringValue", "UNKNOWN")
            repaired = attrs.get("repaired", {}).get("StringValue") == "true"
            count = int(m.get("Attributes", {}).get("ApproximateReceiveCount", "1"))
            try:
                outcome = handle(kind, m["Body"], count, repaired, m["MessageId"], audit)
                if outcome.delete:
                    sqs.delete_message(QueueUrl=queue_url, ReceiptHandle=m["ReceiptHandle"])
            except Exception:
                log.exception("handling %s failed; leaving for redelivery", m["MessageId"])


if __name__ == "__main__":  # pragma: no cover
    run()

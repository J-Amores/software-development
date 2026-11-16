import json

import pytest

from rideforce.simulation import POISON_PILL_BODY
from rideforce.worker import SchemaError, handle, validate

from .conftest import FakeAudit


def assignment_body(**over):
    body = {"id": "DA-0001", "riderId": "rdr-001", "riderName": "Ava Chen", "driverId": "drv-101", "driverCallsign": "RF-101", "etaMin": 3}
    body.update(over)
    return json.dumps(body)


def test_valid_assignment_is_audited_and_deleted():
    audit = FakeAudit()
    out = handle("DISPATCH_ASSIGNMENT", assignment_body(), 1, False, "m-1", audit)
    assert out.delete
    assert audit.types() == ["ASSIGNMENT_COMMITTED"]
    assert audit.processed_n == 1


def test_gps_tick_counts_as_processed_without_audit_row():
    audit = FakeAudit()
    out = handle("GPS_TICK", json.dumps({"driverId": "drv-101", "x": 1.0, "z": 2.0, "ts": 1}), 1, False, "m", audit)
    assert out.delete and audit.rows == [] and audit.processed_n == 1


def test_poison_pill_retries_then_reports_dlq_isolation():
    audit = FakeAudit()
    outcomes = [handle("POISON_PILL", POISON_PILL_BODY, n, False, "pp-1", audit) for n in (1, 2, 3)]
    assert [o.delete for o in outcomes] == [False, False, False]  # never deleted: SQS redrive owns DLQ moves
    assert audit.types() == ["RECEIVE_FAILED", "RECEIVE_FAILED", "DLQ_ISOLATED"]
    assert audit.processed_n == 0


def test_repaired_poison_pill_is_processed_after_replay():
    audit = FakeAudit()
    out = handle("POISON_PILL", POISON_PILL_BODY, 1, True, "pp-1", audit)
    assert out.delete and audit.types() == ["DLQ_REPLAY_PROCESSED"]


@pytest.mark.parametrize(
    "kind,body",
    [
        ("DISPATCH_ASSIGNMENT", "{not json"),
        ("DISPATCH_ASSIGNMENT", assignment_body(riderId=None)),
        ("DISPATCH_ASSIGNMENT", assignment_body(driverId="\u0000")),
        ("DISPATCH_ASSIGNMENT", assignment_body(etaMin="NaN")),
        ("STATUS_TRANSITION", json.dumps({"id": "DA-1"})),
        ("SOMETHING_ELSE", "{}"),
    ],
)
def test_schema_validation_rejects_malformed_events(kind, body):
    with pytest.raises(SchemaError):
        validate(kind, body)

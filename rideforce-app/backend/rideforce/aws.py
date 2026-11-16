"""boto3 adapters for the aws-emulator topology (ADR-0002).

Clients rely on the standard AWS environment variables (AWS_ENDPOINT_URL, AWS_CA_BUNDLE,
AWS_SHARED_CREDENTIALS_FILE, AWS_CONFIG_FILE, AWS_REGION). TLS verification is never disabled.
"""

from __future__ import annotations

import os
import time
import uuid
from dataclasses import dataclass
from typing import Any

import boto3
from botocore.config import Config

from .domain import DispatchRules, ZoneManifest

MAX_RECEIVE_COUNT = 3
AUDIT_PK_PREFIX = "AUDIT#"
STATS_PK = "STATS"


@dataclass(frozen=True)
class Settings:
    queue_name: str = os.getenv("DISPATCH_QUEUE_NAME", "dispatch-events")
    dlq_name: str = os.getenv("DISPATCH_DLQ_NAME", "dispatch-events-dlq")
    audit_table: str = os.getenv("AUDIT_TABLE_NAME", "dispatch-audit")
    manifest_bucket: str = os.getenv("MANIFEST_BUCKET", "rideforce-spatial-manifests")
    manifest_key: str = os.getenv("MANIFEST_KEY", "zones/airport-corridor.json")
    radius_param: str = os.getenv("MAX_MATCH_RADIUS_PARAM", "/rideforce/dispatch/max-match-radius-km")
    zone_id: str = os.getenv("ZONE_ID", "airport-corridor")


_BOTO_CONFIG = Config(retries={"max_attempts": 3, "mode": "standard"}, connect_timeout=3, read_timeout=10)


def client(service: str) -> Any:
    return boto3.client(service, config=_BOTO_CONFIG)


def now_ms() -> int:
    return int(time.time() * 1000)


# ---------------------------------------------------------------------- S3 + SSM


def load_manifest(settings: Settings) -> ZoneManifest:
    body = client("s3").get_object(Bucket=settings.manifest_bucket, Key=settings.manifest_key)["Body"].read()
    return ZoneManifest.from_json(body)


def load_rules(settings: Settings, manifest: ZoneManifest) -> DispatchRules:
    value = client("ssm").get_parameter(Name=settings.radius_param)["Parameter"]["Value"]
    return DispatchRules(max_match_radius_km=float(value), unit_km=manifest.unit_km, avg_speed_kmh=manifest.avg_speed_kmh)


# ---------------------------------------------------------------------- SQS


class SqsEventBus:
    def __init__(self, settings: Settings) -> None:
        self.sqs = client("sqs")
        self.queue_url = self.sqs.get_queue_url(QueueName=settings.queue_name)["QueueUrl"]
        self.dlq_url = self.sqs.get_queue_url(QueueName=settings.dlq_name)["QueueUrl"]

    def publish(self, kind: str, body: str, repaired: bool = False) -> str:
        attrs = {"kind": {"DataType": "String", "StringValue": kind}}
        if repaired:
            attrs["repaired"] = {"DataType": "String", "StringValue": "true"}
        return self.sqs.send_message(QueueUrl=self.queue_url, MessageBody=body, MessageAttributes=attrs)["MessageId"]

    def publish_batch(self, events: list[tuple[str, str]]) -> None:
        for i in range(0, len(events), 10):
            chunk = events[i : i + 10]
            self.sqs.send_message_batch(
                QueueUrl=self.queue_url,
                Entries=[
                    {
                        "Id": str(n),
                        "MessageBody": body,
                        "MessageAttributes": {"kind": {"DataType": "String", "StringValue": kind}},
                    }
                    for n, (kind, body) in enumerate(chunk)
                ],
            )

    def queue_depths(self) -> tuple[int, int, int]:
        names = ["ApproximateNumberOfMessages", "ApproximateNumberOfMessagesNotVisible"]
        q = self.sqs.get_queue_attributes(QueueUrl=self.queue_url, AttributeNames=names)["Attributes"]
        d = self.sqs.get_queue_attributes(QueueUrl=self.dlq_url, AttributeNames=names[:1])["Attributes"]
        return int(q[names[0]]), int(q[names[1]]), int(d[names[0]])

    def peek_dlq(self) -> list[dict[str, Any]]:
        """Read DLQ messages without hiding them (VisibilityTimeout=0)."""
        r = self.sqs.receive_message(
            QueueUrl=self.dlq_url,
            MaxNumberOfMessages=10,
            VisibilityTimeout=0,
            AttributeNames=["SentTimestamp"],
            MessageAttributeNames=["All"],
        )
        out = []
        for m in r.get("Messages", []):
            sent = int(m.get("Attributes", {}).get("SentTimestamp", now_ms()))
            kind = m.get("MessageAttributes", {}).get("kind", {}).get("StringValue", "POISON_PILL")
            out.append(
                {
                    "id": m["MessageId"][:12],
                    "kind": kind,
                    "payload": m["Body"],
                    "malformed": True,
                    "repaired": False,
                    "receiveCount": MAX_RECEIVE_COUNT,
                    "enqueuedAt": sent,
                    "visibleAt": sent,
                }
            )
        return out

    def redrive_dlq(self) -> int:
        """Move every DLQ message back to dispatch-events, flagged for schema repair."""
        moved = 0
        while True:
            r = self.sqs.receive_message(
                QueueUrl=self.dlq_url, MaxNumberOfMessages=10, VisibilityTimeout=30, MessageAttributeNames=["All"]
            )
            msgs = r.get("Messages", [])
            if not msgs:
                return moved
            for m in msgs:
                kind = m.get("MessageAttributes", {}).get("kind", {}).get("StringValue", "POISON_PILL")
                self.publish(kind, m["Body"], repaired=True)
                self.sqs.delete_message(QueueUrl=self.dlq_url, ReceiptHandle=m["ReceiptHandle"])
                moved += 1

    def purge(self) -> None:
        for url in (self.queue_url, self.dlq_url):
            try:
                self.sqs.purge_queue(QueueUrl=url)
            except self.sqs.exceptions.PurgeQueueInProgress:
                pass


# ---------------------------------------------------------------------- DynamoDB


class DynamoAuditStore:
    def __init__(self, settings: Settings) -> None:
        self.ddb = client("dynamodb")
        self.table = settings.audit_table
        self.pk = AUDIT_PK_PREFIX + settings.zone_id

    def write(self, type_: str, detail: str, severity: str = "info") -> None:
        at = now_ms()
        self.ddb.put_item(
            TableName=self.table,
            Item={
                "pk": {"S": self.pk},
                "sk": {"S": f"{at:013d}#{uuid.uuid4().hex[:8]}"},
                "at": {"N": str(at)},
                "type": {"S": type_},
                "detail": {"S": detail},
                "severity": {"S": severity},
            },
        )

    def increment_processed(self) -> None:
        self.ddb.update_item(
            TableName=self.table,
            Key={"pk": {"S": STATS_PK}, "sk": {"S": self.pk}},
            # "processed" is a DynamoDB reserved word: it must go through an attribute-name placeholder.
            UpdateExpression="ADD #processed :one",
            ExpressionAttributeNames={"#processed": "processed"},
            ExpressionAttributeValues={":one": {"N": "1"}},
        )

    def recent(self, limit: int = 60) -> list[dict[str, Any]]:
        r = self.ddb.query(
            TableName=self.table,
            KeyConditionExpression="pk = :p",
            ExpressionAttributeValues={":p": {"S": self.pk}},
            ScanIndexForward=False,
            Limit=limit,
        )
        return [
            {
                "id": i["sk"]["S"],
                "at": int(i["at"]["N"]),
                "type": i["type"]["S"],
                "detail": i["detail"]["S"],
                "severity": i["severity"]["S"],
            }
            for i in r.get("Items", [])
        ]

    def count(self) -> int:
        total, kwargs = 0, {}
        while True:
            r = self.ddb.query(
                TableName=self.table,
                KeyConditionExpression="pk = :p",
                ExpressionAttributeValues={":p": {"S": self.pk}},
                Select="COUNT",
                **kwargs,
            )
            total += r["Count"]
            if "LastEvaluatedKey" not in r:
                return total
            kwargs = {"ExclusiveStartKey": r["LastEvaluatedKey"]}

    def processed(self) -> int:
        r = self.ddb.get_item(TableName=self.table, Key={"pk": {"S": STATS_PK}, "sk": {"S": self.pk}})
        return int(r.get("Item", {}).get("processed", {}).get("N", "0"))

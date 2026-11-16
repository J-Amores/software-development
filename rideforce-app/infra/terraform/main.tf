# Provisions the RideForce dispatch topology on aws-emulator (ADR-0002).
# Runs as a one-shot compose job sharing the emulator's network namespace, so
# https://127.0.0.1:9297 matches the emulator's TLS certificate.

terraform {
  required_version = ">= 1.9"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.80"
    }
  }
  backend "local" {
    path = "/state/terraform.tfstate"
  }
}

variable "emulator_endpoint" {
  type    = string
  default = "https://127.0.0.1:9297"
}

variable "max_match_radius_km" {
  type    = string
  default = "2.4"
}

provider "aws" {
  region = "us-east-1"
  # Credentials and CA come from AWS_SHARED_CREDENTIALS_FILE / AWS_CA_BUNDLE (this run's emulator files).
  s3_use_path_style           = true
  skip_metadata_api_check     = true
  skip_region_validation      = true
  skip_requesting_account_id  = true

  endpoints {
    s3       = var.emulator_endpoint
    sqs      = var.emulator_endpoint
    dynamodb = var.emulator_endpoint
    ssm      = var.emulator_endpoint
    sts      = var.emulator_endpoint
  }
}

# ---------------------------------------------------------------- S3: spatial manifests

resource "aws_s3_bucket" "manifests" {
  bucket = "rideforce-spatial-manifests"
}

resource "aws_s3_object" "airport_corridor" {
  bucket       = aws_s3_bucket.manifests.id
  key          = "zones/airport-corridor.json"
  source       = "/manifest/zone_manifest.json"
  etag         = filemd5("/manifest/zone_manifest.json")
  content_type = "application/json"
}

# ---------------------------------------------------------------- SQS: events + DLQ

resource "aws_sqs_queue" "dispatch_events_dlq" {
  name                      = "dispatch-events-dlq"
  message_retention_seconds = 1209600
}

resource "aws_sqs_queue" "dispatch_events" {
  name                       = "dispatch-events"
  visibility_timeout_seconds = 2
  receive_wait_time_seconds  = 2
  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.dispatch_events_dlq.arn
    maxReceiveCount     = 3
  })
}

# ---------------------------------------------------------------- DynamoDB: audit

resource "aws_dynamodb_table" "dispatch_audit" {
  name         = "dispatch-audit"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "pk"
  range_key    = "sk"

  attribute {
    name = "pk"
    type = "S"
  }
  attribute {
    name = "sk"
    type = "S"
  }

  # DescribeTable reports on-demand caps as -1 ("unlimited"); the provider reads that as drift
  # and issues an empty UpdateTable on re-apply. Ignore it so repeated applies are no-ops.
  lifecycle {
    ignore_changes = [on_demand_throughput]
  }
}

# ---------------------------------------------------------------- SSM: dispatch policy

resource "aws_ssm_parameter" "max_match_radius_km" {
  name  = "/rideforce/dispatch/max-match-radius-km"
  type  = "String"
  value = var.max_match_radius_km
}

output "dispatch_events_url" {
  value = aws_sqs_queue.dispatch_events.url
}

output "dispatch_events_dlq_url" {
  value = aws_sqs_queue.dispatch_events_dlq.url
}

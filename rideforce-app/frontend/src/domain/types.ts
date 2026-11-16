// Domain vocabulary follows GLOSSARY.md. Do not introduce "Match", "Vehicle", "Customer", etc.

export type DriverStatus = 'AVAILABLE' | 'EN_ROUTE' | 'ON_TRIP';
export type RiderStatus = 'WAITING' | 'ASSIGNED' | 'PICKED_UP';

/** Ground-plane coordinate in DispatchZone world units (see ZONE.unitKm). */
export interface Vec2 {
  x: number;
  z: number;
}

export interface Driver {
  id: string;
  callsign: string;
  name: string;
  seats: number;
  status: DriverStatus;
  position: Vec2;
  heading: number;
  riderId?: string;
  assignmentId?: string;
}

export interface Rider {
  id: string;
  name: string;
  partySize: number;
  pickup: Vec2;
  pickupLabel: string;
  destination: string;
  status: RiderStatus;
  requestedAt: number;
  assignedDriverId?: string;
}

/** Calculated proximity pairing between a waiting Rider and an AVAILABLE Driver. */
export interface CandidateLink {
  riderId: string;
  driverId: string;
  rank: number;
  distanceKm: number;
  etaMin: number;
}

export type DispatchAssignmentStatus = 'EN_ROUTE' | 'ON_TRIP' | 'COMPLETED';

/** Confirmed command committing an AVAILABLE Driver to a Rider. */
export interface DispatchAssignment {
  id: string;
  riderId: string;
  riderName: string;
  driverId: string;
  driverCallsign: string;
  status: DispatchAssignmentStatus;
  distanceKm: number;
  etaMin: number;
  createdAt: number;
  pickedUpAt?: number;
  completedAt?: number;
}

export type QueueMessageKind = 'GPS_TICK' | 'DISPATCH_ASSIGNMENT' | 'STATUS_TRANSITION' | 'POISON_PILL';

export interface QueueMessage {
  id: string;
  kind: QueueMessageKind;
  payload: string;
  malformed: boolean;
  repaired: boolean;
  receiveCount: number;
  enqueuedAt: number;
  visibleAt: number;
}

export type AuditSeverity = 'info' | 'warn' | 'error';

export interface AuditEntry {
  id: string;
  at: number;
  type: string;
  detail: string;
  severity: AuditSeverity;
}

export interface CloudTelemetry {
  /** SQS ApproximateNumberOfMessages (visible). */
  queueDepth: number;
  /** SQS ApproximateNumberOfMessagesNotVisible (in-flight / awaiting retry). */
  inFlight: number;
  dlqCount: number;
  dlqMessages: QueueMessage[];
  processed: number;
  maxReceiveCount: number;
  /** DynamoDB dispatch audit item count. */
  auditCount: number;
  audit: AuditEntry[];
  lastGpsTickAt?: number;
  health: 'HEALTHY' | 'DEGRADED';
}

export interface DispatchConfig {
  zoneId: string;
  maxMatchRadiusKm: number;
}

export interface DispatchSnapshot {
  version: number;
  /** Server-provided dispatch policy (SSM). Absent for the in-memory adapter. */
  config?: DispatchConfig;
  drivers: Driver[];
  riders: Rider[];
  assignments: DispatchAssignment[];
  telemetry: CloudTelemetry;
}

import { rankCandidateLinks } from '../domain/candidateLinks';
import type {
  AuditEntry,
  AuditSeverity,
  CandidateLink,
  DispatchAssignment,
  DispatchSnapshot,
  Driver,
  QueueMessage,
  QueueMessageKind,
  Rider,
  Vec2,
} from '../domain/types';
import { ZONE, type Destination } from '../domain/zone';
import type { DispatchGateway, GatewayConnection, LivePosition } from './DispatchGateway';

const SIM_HZ = 30;
const DRIVE_SPEED = 7.5; // world units / second
const CONSUMER_INTERVAL_MS = 320;
const CONSUMER_BATCH = 4;
const VISIBILITY_TIMEOUT_MS = 1300;
const MAX_RECEIVE_COUNT = 3;
const RIDER_SPAWN_MS = 9000;
const MAX_WAITING_RIDERS = 5;
const AUDIT_RETAIN = 80;

interface LiveState extends LivePosition {
  path: Vec2[];
  mode: 'parked' | 'cruising' | 'driving';
  slot?: number;
}

const DRIVER_ROSTER: Array<Pick<Driver, 'name' | 'seats'>> = [
  { name: 'Maya Okafor', seats: 4 },
  { name: 'Luis Herrera', seats: 4 },
  { name: 'Priya Natarajan', seats: 6 },
  { name: 'Tomasz Wójcik', seats: 4 },
  { name: 'Aiko Tanaka', seats: 4 },
  { name: 'Dev Malhotra', seats: 6 },
  { name: 'Sofia Lindqvist', seats: 4 },
  { name: 'Kwame Mensah', seats: 4 },
  { name: 'Hana Kim', seats: 4 },
  { name: 'Mateo Rossi', seats: 4 },
];

const RIDER_NAMES = [
  'Ava Chen', 'Noah Patel', 'Zara Ahmed', 'Elijah Brooks', 'Mina Sato', 'Omar Haddad', 'Isla Murphy',
  'Ravi Iyer', 'Chloe Martin', 'Felix Wagner', 'Leila Nasser', 'Jonah Reyes', 'Ines Duarte', 'Kai Nakamura',
];

/** Deterministic PRNG so the prototype replays identically after Reset. */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function dedupePath(points: Vec2[], from: Vec2): Vec2[] {
  const out: Vec2[] = [];
  let prev = from;
  for (const p of points) {
    if (Math.hypot(p.x - prev.x, p.z - prev.z) > 0.05) {
      out.push(p);
      prev = p;
    }
  }
  return out;
}

export class InMemoryDispatchAdapter implements DispatchGateway {
  readonly kind = 'in-memory' as const;
  private readonly seed: number;
  private rng!: () => number;
  private drivers = new Map<string, Driver>();
  private riders = new Map<string, Rider>();
  private assignments = new Map<string, DispatchAssignment>();
  private live = new Map<string, LiveState>();
  private queue: QueueMessage[] = [];
  private dlq: QueueMessage[] = [];
  private audit: AuditEntry[] = [];
  private processed = 0;
  private auditCount = 0;
  private seq = 0;
  private riderSeq = 0;
  private assignmentSeq = 0;
  private lastGpsTickAt?: number;
  private version = 0;
  private snapshot!: DispatchSnapshot;
  private listeners = new Set<() => void>();
  private timers: number[] = [];
  private lastSimAt = 0;

  constructor(options: { seed?: number } = {}) {
    this.seed = options.seed ?? 9297;
    this.bootstrap();
  }

  // ---------------------------------------------------------------- lifecycle

  start(): void {
    if (this.timers.length) return;
    this.lastSimAt = performance.now();
    this.timers.push(
      window.setInterval(() => this.simulate(), 1000 / SIM_HZ),
      window.setInterval(() => this.consume(), CONSUMER_INTERVAL_MS),
      window.setInterval(() => this.spawnRider(), RIDER_SPAWN_MS),
    );
  }

  stop(): void {
    this.timers.forEach((t) => window.clearInterval(t));
    this.timers = [];
  }

  // ---------------------------------------------------------------- reads

  getConnection(): GatewayConnection {
    return 'local';
  }

  getSnapshot = (): DispatchSnapshot => this.snapshot;

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  getLivePosition(driverId: string): LivePosition | undefined {
    return this.live.get(driverId);
  }

  getCandidateLinks(riderId: string, limit = 3): CandidateLink[] {
    const rider = this.riders.get(riderId);
    if (!rider) return [];
    return rankCandidateLinks(rider, [...this.drivers.values()], (d) => this.live.get(d.id) ?? d.position, limit);
  }

  // ---------------------------------------------------------------- commands

  async createDispatchAssignment(riderId: string, driverId: string): Promise<DispatchAssignment> {
    const assignment = this.assign(riderId, driverId);
    this.commit();
    return assignment;
  }

  async simulateGpsTick(): Promise<void> {
    const now = Date.now();
    for (const d of this.drivers.values()) {
      const live = this.live.get(d.id)!;
      if (live.mode === 'cruising') {
        const nx = Math.max(-30, Math.min(30, live.x + (this.rng() - 0.5) * 9));
        live.heading = nx >= live.x ? Math.PI / 2 : -Math.PI / 2;
        live.x = nx;
      }
      this.enqueue('GPS_TICK', JSON.stringify({ driverId: d.id, x: +live.x.toFixed(2), z: +live.z.toFixed(2), ts: now }));
    }
    this.lastGpsTickAt = now;
    this.log('GPS_TICK_PUBLISHED', `${this.drivers.size} Driver positions published to dispatch-events`, 'info');
    this.commit();
  }

  async injectPoisonPill(): Promise<void> {
    const msg = this.enqueue(
      'POISON_PILL',
      '{"type":"DispatchAssignment","riderId":null,"driverId":"\\u0000","eta":"NaN","schema":"v0"}',
      true,
    );
    this.log('POISON_PILL_INJECTED', `${msg.id} enqueued with malformed schema (maxReceiveCount=${MAX_RECEIVE_COUNT})`, 'warn');
    this.commit();
  }

  async replayDlq(): Promise<void> {
    if (!this.dlq.length) {
      this.log('DLQ_REDRIVE_SKIPPED', 'DLQ empty — nothing to redrive', 'info');
      this.commit();
      return;
    }
    const now = Date.now();
    const redriven = this.dlq.splice(0);
    for (const m of redriven) {
      m.repaired = true;
      m.receiveCount = 0;
      m.visibleAt = now;
      this.queue.push(m);
    }
    this.log('DLQ_REDRIVE', `${redriven.length} message(s) redriven to dispatch-events with schema v2 repair`, 'info');
    this.commit();
  }

  async resetFleet(): Promise<void> {
    this.bootstrap();
    this.log('FLEET_RESET', 'Showcase fleet restored to seed state', 'info');
    this.commit();
  }

  // ---------------------------------------------------------------- internals

  private bootstrap(): void {
    this.rng = mulberry32(this.seed);
    this.drivers.clear();
    this.riders.clear();
    this.assignments.clear();
    this.live.clear();
    this.queue = [];
    this.dlq = [];
    this.audit = [];
    this.processed = 0;
    this.auditCount = 0;
    this.seq = 0;
    this.riderSeq = 0;
    this.assignmentSeq = 0;
    this.lastGpsTickAt = undefined;

    const parkedSlots = [0, 2, 4, 7, 9, 13];
    const cruisers: Vec2[] = [
      { x: -25, z: ZONE.corridorLaneZ },
      { x: -7, z: ZONE.corridorLaneZ },
      { x: 4, z: ZONE.curbLaneZ },
      { x: 26, z: ZONE.corridorLaneZ },
    ];
    DRIVER_ROSTER.forEach((r, i) => {
      const id = `drv-${101 + i}`;
      let state: LiveState;
      if (i < parkedSlots.length) {
        const slot = parkedSlots[i];
        const p = ZONE.stagingSlots[slot];
        state = { x: p.x, z: p.z, heading: Math.PI, path: [], mode: 'parked', slot };
      } else {
        const p = cruisers[i - parkedSlots.length];
        state = { x: p.x, z: p.z, heading: i % 2 ? Math.PI / 2 : -Math.PI / 2, path: [], mode: 'cruising' };
      }
      this.live.set(id, state);
      this.drivers.set(id, {
        id,
        callsign: `RF-${101 + i}`,
        name: r.name,
        seats: r.seats,
        status: 'AVAILABLE',
        position: { x: state.x, z: state.z },
        heading: state.heading,
      });
    });

    [0, 1, 2, 4].forEach((door) => this.addRider(door));
    // One assignment already in flight so all three Driver states are visible on load.
    const inFlight = this.addRider(3);
    this.assign(inFlight.id, 'drv-108');
    this.log('ZONE_ONLINE', `${ZONE.name} DispatchZone online · ${this.drivers.size} Drivers`, 'info');
    this.version = 0;
    this.commit();
  }

  private addRider(doorIndex: number): Rider {
    const door = ZONE.pickupPoints[doorIndex];
    const dest: Destination = ZONE.destinations[Math.floor(this.rng() * ZONE.destinations.length)];
    const n = this.riderSeq++;
    const rider: Rider = {
      id: `rdr-${String(n + 1).padStart(3, '0')}`,
      name: RIDER_NAMES[n % RIDER_NAMES.length],
      partySize: this.rng() < 0.12 ? 5 : 1 + Math.floor(this.rng() * 3),
      pickup: { x: door.x + (this.rng() - 0.5) * 1.2, z: door.z },
      pickupLabel: door.label,
      destination: dest.label,
      status: 'WAITING',
      requestedAt: Date.now() - Math.floor(this.rng() * 120_000),
    };
    this.riders.set(rider.id, rider);
    return rider;
  }

  private assign(riderId: string, driverId: string): DispatchAssignment {
    const rider = this.riders.get(riderId);
    const driver = this.drivers.get(driverId);
    if (!rider || rider.status !== 'WAITING') throw new Error(`Rider ${riderId} is not waiting`);
    if (!driver || driver.status !== 'AVAILABLE') throw new Error(`Driver ${driverId} is not AVAILABLE`);
    const link = rankCandidateLinks(rider, [driver], (d) => this.live.get(d.id) ?? d.position, 1)[0];

    const assignment: DispatchAssignment = {
      id: `DA-${String(++this.assignmentSeq).padStart(4, '0')}`,
      riderId,
      riderName: rider.name,
      driverId,
      driverCallsign: driver.callsign,
      status: 'EN_ROUTE',
      distanceKm: link?.distanceKm ?? 0,
      etaMin: link?.etaMin ?? 0,
      createdAt: Date.now(),
    };
    this.assignments.set(assignment.id, assignment);

    driver.status = 'EN_ROUTE';
    driver.riderId = riderId;
    driver.assignmentId = assignment.id;
    rider.status = 'ASSIGNED';
    rider.assignedDriverId = driverId;

    const live = this.live.get(driverId)!;
    const stop = { x: rider.pickup.x, z: ZONE.curbLaneZ };
    const onCurb = Math.abs(live.z - ZONE.curbLaneZ) < 0.5;
    live.path = dedupePath(
      onCurb ? [stop] : [{ x: live.x, z: ZONE.corridorLaneZ }, { x: stop.x, z: ZONE.corridorLaneZ }, stop],
      live,
    );
    live.mode = 'driving';
    live.slot = undefined;

    this.enqueue('DISPATCH_ASSIGNMENT', JSON.stringify({ id: assignment.id, riderId, driverId, etaMin: assignment.etaMin }));
    return assignment;
  }

  private simulate(): void {
    const now = performance.now();
    const dt = Math.min(0.1, (now - this.lastSimAt) / 1000);
    this.lastSimAt = now;
    let changed = false;

    for (const driver of this.drivers.values()) {
      const live = this.live.get(driver.id)!;
      if (live.mode !== 'driving' || !live.path.length) continue;
      let budget = DRIVE_SPEED * dt;
      while (budget > 0 && live.path.length) {
        const target = live.path[0];
        const dx = target.x - live.x;
        const dz = target.z - live.z;
        const dist = Math.hypot(dx, dz);
        if (dist > 1e-4) live.heading = Math.atan2(dx, dz);
        if (dist <= budget) {
          live.x = target.x;
          live.z = target.z;
          live.path.shift();
          budget -= dist;
        } else {
          live.x += (dx / dist) * budget;
          live.z += (dz / dist) * budget;
          budget = 0;
        }
      }
      if (!live.path.length) {
        changed = this.onArrival(driver, live) || changed;
      }
    }
    if (changed) this.commit();
  }

  private onArrival(driver: Driver, live: LiveState): boolean {
    const assignment = driver.assignmentId ? this.assignments.get(driver.assignmentId) : undefined;
    const rider = driver.riderId ? this.riders.get(driver.riderId) : undefined;
    if (!assignment) return false;

    if (driver.status === 'EN_ROUTE') {
      driver.status = 'ON_TRIP';
      assignment.status = 'ON_TRIP';
      assignment.pickedUpAt = Date.now();
      const dest = ZONE.destinations.find((d) => d.label === rider?.destination) ?? ZONE.destinations[0];
      if (rider) rider.status = 'PICKED_UP';
      live.path = [{ x: live.x + (dest.exit === 'east' ? 2 : -2), z: ZONE.corridorLaneZ }, ZONE.exits[dest.exit]];
      this.enqueue('STATUS_TRANSITION', JSON.stringify({ id: assignment.id, from: 'EN_ROUTE', to: 'ON_TRIP' }));
      return true;
    }

    if (driver.status === 'ON_TRIP') {
      assignment.status = 'COMPLETED';
      assignment.completedAt = Date.now();
      if (rider) this.riders.delete(rider.id);
      driver.status = 'AVAILABLE';
      driver.riderId = undefined;
      driver.assignmentId = undefined;
      const slot = this.freeSlot();
      const p = ZONE.stagingSlots[slot];
      Object.assign(live, { x: p.x, z: p.z, heading: Math.PI, path: [], mode: 'parked', slot });
      this.enqueue('STATUS_TRANSITION', JSON.stringify({ id: assignment.id, from: 'ON_TRIP', to: 'COMPLETED' }));
      this.pruneAssignments();
      return true;
    }
    return false;
  }

  private freeSlot(): number {
    const taken = new Set([...this.live.values()].map((l) => l.slot).filter((s) => s !== undefined));
    const free = ZONE.stagingSlots.map((_, i) => i).filter((i) => !taken.has(i));
    return free.length ? free[Math.floor(this.rng() * free.length)] : 0;
  }

  private pruneAssignments(): void {
    const done = [...this.assignments.values()].filter((a) => a.status === 'COMPLETED');
    done.slice(0, Math.max(0, done.length - 12)).forEach((a) => this.assignments.delete(a.id));
  }

  private spawnRider(): void {
    const waiting = [...this.riders.values()].filter((r) => r.status === 'WAITING');
    if (waiting.length >= MAX_WAITING_RIDERS) return;
    const occupied = new Set([...this.riders.values()].filter((r) => r.status !== 'PICKED_UP').map((r) => r.pickupLabel));
    const free = ZONE.pickupPoints.map((_, i) => i).filter((i) => !occupied.has(ZONE.pickupPoints[i].label));
    if (!free.length) return;
    const rider = this.addRider(free[Math.floor(this.rng() * free.length)]);
    rider.requestedAt = Date.now();
    this.log('RIDER_REQUESTED', `${rider.name} waiting at ${rider.pickupLabel} → ${rider.destination}`, 'info');
    this.commit();
  }

  private enqueue(kind: QueueMessageKind, payload: string, malformed = false): QueueMessage {
    const now = Date.now();
    const msg: QueueMessage = {
      id: `${kind === 'POISON_PILL' ? 'pp' : 'msg'}-${(++this.seq).toString(36).padStart(4, '0')}`,
      kind,
      payload,
      malformed,
      repaired: false,
      receiveCount: 0,
      enqueuedAt: now,
      visibleAt: now,
    };
    this.queue.push(msg);
    return msg;
  }

  /** Simulated Lambda/worker consumer with SQS visibility timeout + DLQ redrive policy. */
  private consume(): void {
    const now = Date.now();
    const batch: QueueMessage[] = [];
    for (const m of this.queue) {
      if (batch.length >= CONSUMER_BATCH) break;
      if (m.visibleAt <= now) batch.push(m);
    }
    if (!batch.length) {
      // Visibility timeouts may have elapsed; refresh depth/in-flight counters.
      if (this.queue.length) this.commit();
      return;
    }

    for (const m of batch) {
      m.receiveCount++;
      if (m.malformed && !m.repaired) {
        if (m.receiveCount >= MAX_RECEIVE_COUNT) {
          this.queue.splice(this.queue.indexOf(m), 1);
          this.dlq.push(m);
          this.log('DLQ_ISOLATED', `${m.id} moved to dispatch-events-dlq after ${m.receiveCount} receives`, 'error');
        } else {
          m.visibleAt = now + VISIBILITY_TIMEOUT_MS;
          this.log('RECEIVE_FAILED', `${m.id} schema validation failed (receive ${m.receiveCount}/${MAX_RECEIVE_COUNT})`, 'warn');
        }
        continue;
      }
      this.queue.splice(this.queue.indexOf(m), 1);
      this.processed++;
      this.writeAuditFor(m);
    }
    this.commit();
  }

  private writeAuditFor(m: QueueMessage): void {
    if (m.kind === 'GPS_TICK') return; // telemetry only; not a dispatch audit item
    if (m.kind === 'POISON_PILL') {
      this.log('DLQ_REPLAY_PROCESSED', `${m.id} re-processed after schema repair`, 'info');
      return;
    }
    const body = JSON.parse(m.payload) as { id: string; riderId?: string; driverId?: string; from?: string; to?: string };
    const a = this.assignments.get(body.id);
    if (m.kind === 'DISPATCH_ASSIGNMENT') {
      this.log('ASSIGNMENT_COMMITTED', `${body.id} · ${a?.driverCallsign ?? body.driverId} → ${a?.riderName ?? body.riderId}`, 'info');
    } else {
      this.log('STATUS_TRANSITION', `${body.id} · ${a?.driverCallsign ?? ''} ${body.from} → ${body.to}`, 'info');
    }
  }

  private log(type: string, detail: string, severity: AuditSeverity): void {
    this.auditCount++;
    this.audit.unshift({ id: `aud-${this.auditCount}`, at: Date.now(), type, detail, severity });
    if (this.audit.length > AUDIT_RETAIN) this.audit.length = AUDIT_RETAIN;
  }

  private commit(): void {
    const now = Date.now();
    for (const d of this.drivers.values()) {
      const l = this.live.get(d.id)!;
      d.position = { x: l.x, z: l.z };
      d.heading = l.heading;
    }
    const visible = this.queue.filter((m) => m.visibleAt <= now).length;
    this.snapshot = {
      version: ++this.version,
      drivers: [...this.drivers.values()].map((d) => ({ ...d })),
      riders: [...this.riders.values()].map((r) => ({ ...r, pickup: { ...r.pickup } })),
      assignments: [...this.assignments.values()].map((a) => ({ ...a })).reverse(),
      telemetry: {
        queueDepth: visible,
        inFlight: this.queue.length - visible,
        dlqCount: this.dlq.length,
        dlqMessages: this.dlq.map((m) => ({ ...m })),
        processed: this.processed,
        maxReceiveCount: MAX_RECEIVE_COUNT,
        auditCount: this.auditCount,
        audit: [...this.audit],
        lastGpsTickAt: this.lastGpsTickAt,
        health: this.dlq.length ? 'DEGRADED' : 'HEALTHY',
      },
    };
    this.listeners.forEach((l) => l());
  }
}

import { rankCandidateLinks } from '../domain/candidateLinks';
import type { CandidateLink, DispatchAssignment, DispatchSnapshot } from '../domain/types';
import type { DispatchGateway, GatewayConnection, LivePosition } from './DispatchGateway';

const EMPTY_SNAPSHOT: DispatchSnapshot = {
  version: 0,
  drivers: [],
  riders: [],
  assignments: [],
  telemetry: {
    queueDepth: 0,
    inFlight: 0,
    dlqCount: 0,
    dlqMessages: [],
    processed: 0,
    maxReceiveCount: 3,
    auditCount: 0,
    audit: [],
    health: 'HEALTHY',
  },
};

/** positions event: driverId → [x, z, heading] at ~10 Hz. */
type PositionsFrame = Record<string, [number, number, number]>;

/**
 * Live adapter for the FastAPI dispatch service (ADR-0001/0002).
 * Reads: one Server-Sent Events stream (`snapshot` on every discrete change, `positions` at ~10 Hz).
 * Writes: JSON commands over HTTP. The server is the authority; this adapter keeps no domain state.
 */
export class HttpDispatchAdapter implements DispatchGateway {
  readonly kind = 'http' as const;
  private snapshot: DispatchSnapshot = EMPTY_SNAPSHOT;
  private live = new Map<string, LivePosition>();
  private listeners = new Set<() => void>();
  private source?: EventSource;
  private connection: GatewayConnection = 'connecting';

  constructor(private readonly baseUrl = '') {}

  // ---------------------------------------------------------------- lifecycle

  start(): void {
    if (this.source) return;
    this.setConnection('connecting');
    const es = new EventSource(`${this.baseUrl}/api/stream`);
    es.addEventListener('snapshot', (e) => {
      const next = JSON.parse((e as MessageEvent<string>).data) as DispatchSnapshot;
      // Discrete changes (e.g. a return to the Staging Lot) must win over the last position frame.
      for (const d of next.drivers) this.live.set(d.id, { x: d.position.x, z: d.position.z, heading: d.heading });
      this.snapshot = next;
      this.connection = 'live';
      this.emit();
    });
    es.addEventListener('positions', (e) => {
      const frame = JSON.parse((e as MessageEvent<string>).data) as PositionsFrame;
      for (const [id, [x, z, heading]] of Object.entries(frame)) this.live.set(id, { x, z, heading });
    });
    es.onopen = () => this.setConnection('live');
    es.onerror = () => this.setConnection(es.readyState === EventSource.CLOSED ? 'offline' : 'connecting');
    this.source = es;
  }

  stop(): void {
    this.source?.close();
    this.source = undefined;
  }

  // ---------------------------------------------------------------- reads

  getConnection(): GatewayConnection {
    return this.connection;
  }

  getSnapshot = (): DispatchSnapshot => this.snapshot;

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  getLivePosition(driverId: string): LivePosition | undefined {
    return this.live.get(driverId);
  }

  /** Same ranking rule as the server, evaluated on the latest streamed positions and the SSM radius. */
  getCandidateLinks(riderId: string, limit = 3): CandidateLink[] {
    const rider = this.snapshot.riders.find((r) => r.id === riderId);
    if (!rider) return [];
    return rankCandidateLinks(
      rider,
      this.snapshot.drivers,
      (d) => this.live.get(d.id) ?? d.position,
      limit,
      this.snapshot.config?.maxMatchRadiusKm,
    );
  }

  // ---------------------------------------------------------------- commands

  createDispatchAssignment(riderId: string, driverId: string): Promise<DispatchAssignment> {
    return this.post<DispatchAssignment>('/api/dispatch-assignments', { riderId, driverId });
  }

  async simulateGpsTick(): Promise<void> {
    await this.post('/api/chaos/gps-tick');
  }

  async injectPoisonPill(): Promise<void> {
    await this.post('/api/chaos/poison-pill');
  }

  async replayDlq(): Promise<void> {
    await this.post('/api/chaos/dlq-replay');
  }

  async resetFleet(): Promise<void> {
    await this.post('/api/fleet/reset');
  }

  // ---------------------------------------------------------------- internals

  private async post<T = unknown>(path: string, body?: unknown): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: 'POST',
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      const detail = await res.json().catch(() => ({}));
      throw new Error(`${res.status} ${(detail as { detail?: string }).detail ?? res.statusText}`);
    }
    return (await res.json()) as T;
  }

  private setConnection(c: GatewayConnection): void {
    if (this.connection === c) return;
    this.connection = c;
    // Re-publish the same data under a new object so useSyncExternalStore consumers re-render.
    this.snapshot = { ...this.snapshot };
    this.emit();
  }

  private emit(): void {
    this.listeners.forEach((l) => l());
  }
}

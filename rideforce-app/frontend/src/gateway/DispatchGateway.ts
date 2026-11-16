import type { CandidateLink, DispatchAssignment, DispatchSnapshot } from '../domain/types';

export interface LivePosition {
  x: number;
  z: number;
  heading: number;
}

export type GatewayConnection = 'local' | 'connecting' | 'live' | 'offline';

/**
 * The single frontend seam (ADR-0001). All viewport and HUD components depend on this
 * interface only. Satisfied by InMemoryDispatchAdapter (browser simulation) and
 * HttpDispatchAdapter (FastAPI + SSE backed by aws-emulator).
 */
export interface DispatchGateway {
  /** Which adapter satisfies the seam (shown in the UI so demos are never ambiguous). */
  readonly kind: 'in-memory' | 'http';
  getConnection(): GatewayConnection;
  /** Immutable snapshot; replaced on every discrete state change. */
  getSnapshot(): DispatchSnapshot;
  subscribe(listener: () => void): () => void;
  /** High-frequency Driver position, read per frame by the 3D viewport (not part of the snapshot cadence). */
  getLivePosition(driverId: string): LivePosition | undefined;

  getCandidateLinks(riderId: string, limit?: number): CandidateLink[];
  createDispatchAssignment(riderId: string, driverId: string): Promise<DispatchAssignment>;

  simulateGpsTick(): Promise<void>;
  injectPoisonPill(): Promise<void>;
  replayDlq(): Promise<void>;
  resetFleet(): Promise<void>;

  start(): void;
  stop(): void;
}

import { createContext, useCallback, useContext, useEffect, useMemo, useState, useSyncExternalStore, type ReactNode } from 'react';
import type { CandidateLink, DispatchSnapshot } from '../domain/types';
import type { DispatchGateway } from '../gateway/DispatchGateway';
import { HttpDispatchAdapter } from '../gateway/HttpDispatchAdapter';
import { InMemoryDispatchAdapter } from '../gateway/InMemoryDispatchAdapter';

/**
 * Pick the adapter behind the DispatchGateway seam.
 * `?gateway=http|memory` wins; otherwise VITE_DISPATCH_GATEWAY (the compose build sets `http`);
 * otherwise the in-memory prototype.
 */
export function createGateway(): DispatchGateway {
  const fromUrl = new URLSearchParams(window.location.search).get('gateway');
  const choice = fromUrl ?? import.meta.env.VITE_DISPATCH_GATEWAY ?? 'memory';
  return choice === 'http' ? new HttpDispatchAdapter() : new InMemoryDispatchAdapter();
}

export type CameraPreset = 'Tour' | 'Terminal Pickup' | 'Staging Lot';
export const CAMERA_PRESETS: CameraPreset[] = ['Tour', 'Terminal Pickup', 'Staging Lot'];

interface UiState {
  selectedRiderId?: string;
  selectedDriverId?: string;
  cameraPreset: CameraPreset;
  selectRider(id?: string): void;
  selectDriver(id?: string): void;
  clearSelection(): void;
  setCameraPreset(p: CameraPreset): void;
}

const GatewayContext = createContext<DispatchGateway | null>(null);
const UiContext = createContext<UiState | null>(null);

export function DispatchProvider({ gateway: injected, children }: { gateway?: DispatchGateway; children: ReactNode }) {
  const [gateway] = useState<DispatchGateway>(() => injected ?? createGateway());
  useEffect(() => {
    gateway.start();
    return () => gateway.stop();
  }, [gateway]);

  const [selectedRiderId, setRider] = useState<string>();
  const [selectedDriverId, setDriver] = useState<string>();
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>('Tour');

  const ui = useMemo<UiState>(
    () => ({
      selectedRiderId,
      selectedDriverId,
      cameraPreset,
      selectRider: (id) => {
        setRider(id);
        setDriver(undefined);
      },
      selectDriver: (id) => {
        setDriver(id);
        setRider(undefined);
      },
      clearSelection: () => {
        setRider(undefined);
        setDriver(undefined);
      },
      setCameraPreset,
    }),
    [selectedRiderId, selectedDriverId, cameraPreset],
  );

  return (
    <GatewayContext.Provider value={gateway}>
      <UiContext.Provider value={ui}>{children}</UiContext.Provider>
    </GatewayContext.Provider>
  );
}

export function useGateway(): DispatchGateway {
  const g = useContext(GatewayContext);
  if (!g) throw new Error('useGateway must be used inside DispatchProvider');
  return g;
}

export function useUi(): UiState {
  const u = useContext(UiContext);
  if (!u) throw new Error('useUi must be used inside DispatchProvider');
  return u;
}

export function useDispatchSnapshot(): DispatchSnapshot {
  const g = useGateway();
  return useSyncExternalStore(g.subscribe, g.getSnapshot);
}

export function useCandidateLinks(riderId?: string, limit = 3): CandidateLink[] {
  const g = useGateway();
  const snapshot = useDispatchSnapshot();
  return useMemo(
    () => (riderId ? g.getCandidateLinks(riderId, limit) : []),
    // Recompute whenever the gateway publishes a new snapshot.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [g, riderId, limit, snapshot.version],
  );
}

export function useDispatchActions() {
  const g = useGateway();
  const ui = useUi();
  const dispatch = useCallback(
    async (riderId: string, driverId: string) => {
      try {
        await g.createDispatchAssignment(riderId, driverId);
        ui.selectDriver(driverId);
      } catch (err) {
        console.warn('[DispatchAssignment rejected]', err);
      }
    },
    [g, ui],
  );
  return {
    dispatch,
    simulateGpsTick: () => g.simulateGpsTick(),
    injectPoisonPill: () => g.injectPoisonPill(),
    replayDlq: () => g.replayDlq(),
    resetFleet: async () => {
      ui.clearSelection();
      await g.resetFleet();
    },
  };
}

export function useNow(intervalMs = 1000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => window.clearInterval(t);
  }, [intervalMs]);
  return now;
}

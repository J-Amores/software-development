import { Canvas } from '@react-three/fiber';
import { Suspense } from 'react';
import { CARBON, DRIVER_STATUS_COLOR } from '../domain/palette';
import { useCandidateLinks, useDispatchActions, useDispatchSnapshot, useUi } from '../state/DispatchContext';
import { AirportCorridor, ZONE_LABELS } from './AirportCorridor';
import { CameraRig, PRESET_POSES } from './CameraRig';
import { DriverBeacon } from './DriverBeacon';
import { Label, LabelProjector, LabelProvider, useLabels } from './labels';
import { AssignmentRoute, CandidateLinkArc } from './Links';
import { RiderPin } from './RiderPin';

function DispatchScene() {
  const snapshot = useDispatchSnapshot();
  const ui = useUi();
  const links = useCandidateLinks(ui.selectedRiderId, 3);
  const selectedRider = snapshot.riders.find((r) => r.id === ui.selectedRiderId);
  const rankByDriver = new Map(links.map((l) => [l.driverId, l.rank]));

  return (
    <>
      <CameraRig preset={ui.cameraPreset} />
      <LabelProjector />
      <ambientLight intensity={0.7} />
      <hemisphereLight args={['#c8d8ff', '#1a1612', 0.6]} />
      <directionalLight
        position={[30, 45, 20]}
        intensity={2}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-50}
        shadow-camera-right={50}
        shadow-camera-top={50}
        shadow-camera-bottom={-50}
      />
      <AirportCorridor />

      {snapshot.drivers.map((d) => (
        <DriverBeacon
          key={d.id}
          driver={d}
          selected={ui.selectedDriverId === d.id}
          candidateRank={rankByDriver.get(d.id)}
          onSelect={ui.selectDriver}
        />
      ))}
      {snapshot.riders
        .filter((r) => r.status !== 'PICKED_UP')
        .map((r) => (
          <RiderPin key={r.id} rider={r} selected={ui.selectedRiderId === r.id} onSelect={ui.selectRider} />
        ))}

      {selectedRider &&
        links.map((l) => {
          const driver = snapshot.drivers.find((d) => d.id === l.driverId);
          return driver ? <CandidateLinkArc key={`${selectedRider.id}-${l.driverId}`} link={l} rider={selectedRider} driver={driver} /> : null;
        })}

      {snapshot.drivers
        .filter((d) => d.status !== 'AVAILABLE')
        .map((d) => (
          <AssignmentRoute key={`${d.id}-${d.assignmentId}-${d.status}`} driver={d} rider={snapshot.riders.find((r) => r.id === d.riderId)} />
        ))}
    </>
  );
}

/** DOM labels anchored to 3D positions (rendered outside the Canvas, in the main React tree). */
function LabelLayer() {
  const snapshot = useDispatchSnapshot();
  const ui = useUi();
  const { hovered } = useLabels();
  const { dispatch } = useDispatchActions();
  const links = useCandidateLinks(ui.selectedRiderId, 3);
  const rider = snapshot.riders.find((r) => r.id === ui.selectedRiderId);

  return (
    <div className="pointer-events-none absolute inset-0 isolate overflow-hidden">
      {ZONE_LABELS.map((z) => (
        <Label key={z.id} id={z.id} at={z.at}>
          <div className="whitespace-nowrap rounded-sm border border-line/70 bg-canvas/70 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
            {z.text}
          </div>
        </Label>
      ))}

      {snapshot.drivers
        .filter((d) => ui.selectedDriverId === d.id || hovered === `driver:${d.id}`)
        .map((d) => (
          <Label key={d.id} id={`driver:${d.id}`}>
            <div className="flex items-center gap-1.5 whitespace-nowrap rounded border border-line bg-card/90 px-2 py-0.5 font-mono text-[11px] text-ink shadow-lg">
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: DRIVER_STATUS_COLOR[d.status] }} />
              {d.callsign}
              <span className="text-faint">{d.status.replace('_', ' ')}</span>
            </div>
          </Label>
        ))}

      {snapshot.riders
        .filter((r) => r.status !== 'PICKED_UP' && (ui.selectedRiderId === r.id || hovered === `rider:${r.id}`))
        .map((r) => (
          <Label key={r.id} id={`rider:${r.id}`} at={[r.pickup.x, 2.9, r.pickup.z]}>
            <div className="whitespace-nowrap rounded border border-line bg-card/90 px-2 py-1 text-[11px] leading-tight shadow-lg">
              <div className="font-medium text-ink">
                {r.name} <span className="text-faint">· {r.partySize} pax</span>
              </div>
              <div className="font-mono text-[10px] text-muted">
                {r.pickupLabel} → {r.destination}
              </div>
            </div>
          </Label>
        ))}

      {rider &&
        links.map((l) => {
          const d = snapshot.drivers.find((x) => x.id === l.driverId);
          if (!d) return null;
          const top = l.rank === 1;
          return (
            <Label key={l.driverId} id={`link:${l.driverId}`} interactive>
              <div
                className={`flex items-center gap-2 whitespace-nowrap rounded-md border px-2 py-1 font-mono text-[11px] shadow-xl ${
                  top ? 'border-available/70 bg-card/95' : 'border-line bg-card/85'
                }`}
              >
                <span className={`font-semibold ${top ? 'text-available' : 'text-muted'}`}>#{l.rank}</span>
                <span className="text-ink">{d.callsign}</span>
                <span className="tabular text-muted">{l.distanceKm.toFixed(2)} km</span>
                <span className="tabular text-ink">{l.etaMin} min</span>
                <button
                  type="button"
                  onClick={() => dispatch(rider.id, d.id)}
                  className="rounded bg-available/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-available hover:bg-available hover:text-canvas"
                >
                  Dispatch
                </button>
              </div>
            </Label>
          );
        })}
    </div>
  );
}

export function DispatchViewport({ className = '' }: { className?: string }) {
  const ui = useUi();
  return (
    <LabelProvider>
      <div className={`relative h-full w-full ${className}`}>
        <Canvas
          shadows
          dpr={[1, 2]}
          camera={{ position: PRESET_POSES.Tour.position, fov: 42, near: 0.5, far: 400 }}
          onPointerMissed={() => ui.clearSelection()}
        >
          <color attach="background" args={[CARBON.canvas]} />
          <fog attach="fog" args={[CARBON.canvas, 80, 170]} />
          <Suspense fallback={null}>
            <DispatchScene />
          </Suspense>
        </Canvas>
        <LabelLayer />
      </div>
    </LabelProvider>
  );
}

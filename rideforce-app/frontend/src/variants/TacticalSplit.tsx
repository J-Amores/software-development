import { DispatchViewport } from '../scene/DispatchViewport';
import { useDispatchSnapshot, useUi } from '../state/DispatchContext';
import {
  AuditLog,
  Brand,
  CameraPresetTabs,
  Card,
  CandidateLinkRanking,
  ChaosActions,
  CloudTelemetry,
  DlqAlert,
  DlqPanel,
  DriverInspector,
  FleetCounts,
  HealthBadge,
  RiderQueue,
} from '../hud/widgets';

/** Left dispatch command drawer · center 3D viewport · right AWS telemetry + chaos drawer. */
export function TacticalSplit() {
  const ui = useUi();
  const { riders, drivers } = useDispatchSnapshot();
  const rider = riders.find((r) => r.id === ui.selectedRiderId);
  const driver = drivers.find((d) => d.id === ui.selectedDriverId);
  const waiting = riders.filter((r) => r.status === 'WAITING').length;

  return (
    <div className="grid h-full w-full grid-cols-[320px_minmax(0,1fr)_340px] bg-canvas">
      {/* Left: dispatch command drawer */}
      <aside className="scroll-thin flex min-h-0 flex-col gap-3 overflow-y-auto border-r border-line p-3">
        <Brand />
        <FleetCounts compact />
        <Card title="Rider Queue" aside={<span className="font-mono text-[10px] text-rider">{waiting} waiting</span>}>
          <RiderQueue dense />
        </Card>
        <Card
          title="CandidateLinks"
          aside={rider && <span className="truncate font-mono text-[10px] text-muted">for {rider.name}</span>}
        >
          <CandidateLinkRanking rider={rider} />
        </Card>
        {driver && (
          <Card title="Driver">
            <DriverInspector driver={driver} />
          </Card>
        )}
      </aside>

      {/* Center: viewport */}
      <main className="relative min-h-0 min-w-0">
        <DispatchViewport />
        <div className="absolute left-3 top-3 flex items-center gap-2">
          <CameraPresetTabs className="glass" />
        </div>
        <div className="pointer-events-none absolute right-3 top-3 font-mono text-[10px] uppercase tracking-[0.18em] text-faint">Airport Corridor</div>
        <DlqAlert className="absolute inset-x-3 top-14" />
      </main>

      {/* Right: AWS cloud telemetry + chaos drawer */}
      <aside className="scroll-thin flex min-h-0 flex-col gap-3 overflow-y-auto border-l border-line p-3">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted">AWS Cloud Telemetry</span>
          <HealthBadge />
        </div>
        <Card title="dispatch-events · SQS">
          <CloudTelemetry />
        </Card>
        <Card title="Chaos Actions">
          <div className="p-3">
            <ChaosActions />
            <p className="mt-2 text-[11px] leading-relaxed text-faint">
              A PoisonPill fails schema validation, retries until maxReceiveCount, then is isolated in the DLQ while dispatch keeps flowing.
            </p>
          </div>
        </Card>
        <Card title="Dead-Letter Queue">
          <DlqPanel />
        </Card>
        <Card title="DynamoDB · dispatch-audit" className="flex min-h-[220px] flex-1 flex-col">
          <AuditLog className="min-h-0 flex-1 py-1" limit={60} />
        </Card>
      </aside>
    </div>
  );
}

import { DRIVER_STATUS_COLOR, RIDER_STATUS_COLOR } from '../domain/palette';
import { DispatchViewport } from '../scene/DispatchViewport';
import { useDispatchSnapshot, useUi } from '../state/DispatchContext';
import {
  AuditLog,
  Brand,
  CameraPresetTabs,
  CandidateLinkRanking,
  ChaosActions,
  DlqAlert,
  FleetCounts,
  HealthBadge,
  Metric,
  QueueMeter,
} from '../hud/widgets';

function RadarScope() {
  const { drivers, riders } = useDispatchSnapshot();
  const ui = useUi();
  // Map the corridor (x: -40..40, z: -34..22) into a 120px scope.
  const px = (x: number) => 60 + (x / 40) * 54;
  const pz = (z: number) => 60 + ((z + 6) / 30) * 54;
  return (
    <svg viewBox="0 0 120 120" className="h-[120px] w-[120px] shrink-0">
      <defs>
        <radialGradient id="sweep" cx="0" cy="0" r="1">
          <stop offset="0" stopColor="#4ADE80" stopOpacity="0.35" />
          <stop offset="1" stopColor="#4ADE80" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="60" cy="60" r="57" fill="#121212" stroke="#3A3834" />
      {[19, 38].map((r) => (
        <circle key={r} cx="60" cy="60" r={r} fill="none" stroke="#2a2927" />
      ))}
      <line x1="3" y1="60" x2="117" y2="60" stroke="#2a2927" />
      <line x1="60" y1="3" x2="60" y2="117" stroke="#2a2927" />
      <g className="radar-sweep">
        <path d="M60 60 L60 3 A57 57 0 0 1 108 30 Z" fill="url(#sweep)" />
      </g>
      {riders
        .filter((r) => r.status !== 'PICKED_UP')
        .map((r) => (
          <circle
            key={r.id}
            cx={px(r.pickup.x)}
            cy={pz(r.pickup.z)}
            r={ui.selectedRiderId === r.id ? 3.6 : 2.4}
            fill={RIDER_STATUS_COLOR[r.status]}
            className="cursor-pointer"
            onClick={() => ui.selectRider(r.id)}
          />
        ))}
      {drivers.map((d) => (
        <rect
          key={d.id}
          x={px(d.position.x) - 1.8}
          y={pz(d.position.z) - 1.8}
          width={3.6}
          height={3.6}
          fill={DRIVER_STATUS_COLOR[d.status]}
          opacity={ui.selectedDriverId && ui.selectedDriverId !== d.id ? 0.5 : 1}
          className="cursor-pointer"
          onClick={() => ui.selectDriver(d.id)}
        />
      ))}
    </svg>
  );
}

/** Full-bleed 3D canvas with a compact glassmorphic bottom-docked command deck. */
export function RadarHud() {
  const ui = useUi();
  const { riders, telemetry: t } = useDispatchSnapshot();
  const rider = riders.find((r) => r.id === ui.selectedRiderId);
  const waiting = riders.filter((r) => r.status === 'WAITING');

  return (
    <div className="relative h-full w-full overflow-hidden">
      <DispatchViewport />

      <div className="pointer-events-none absolute inset-x-4 top-4 flex items-start justify-between gap-3">
        <div className="glass pointer-events-auto rounded-lg border border-line px-3 py-2">
          <Brand />
        </div>
        <CameraPresetTabs className="glass pointer-events-auto" />
      </div>

      <DlqAlert className="absolute left-1/2 top-20 w-[min(560px,calc(100%-32px))] -translate-x-1/2" />

      {/* Command deck */}
      <div className="absolute inset-x-4 bottom-16 flex justify-center">
        <div className="glass grid w-full max-w-[1280px] grid-cols-[auto_minmax(0,1.1fr)_minmax(0,1.5fr)_minmax(0,1fr)] gap-0 divide-x divide-line/70 rounded-2xl border border-line shadow-[0_20px_60px_-20px_rgba(0,0,0,0.8)]">
          {/* Radar */}
          <div className="flex items-center gap-3 p-3">
            <RadarScope />
            <div className="space-y-2">
              <FleetCounts compact />
              <HealthBadge />
            </div>
          </div>

          {/* Waiting riders */}
          <div className="min-w-0 p-3">
            <div className="mb-2 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.16em] text-muted">
              <span>Waiting Riders</span>
              <span className="text-rider">{waiting.length}</span>
            </div>
            <div className="scroll-thin flex max-h-[104px] flex-wrap gap-1.5 overflow-y-auto">
              {waiting.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => ui.selectRider(ui.selectedRiderId === r.id ? undefined : r.id)}
                  className={`rounded-md border px-2 py-1 text-left text-[11px] transition-colors ${
                    ui.selectedRiderId === r.id ? 'border-rider bg-rider/15 text-ink' : 'border-line bg-canvas/40 text-muted hover:text-ink'
                  }`}
                >
                  <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-rider" />
                  {r.name}
                  <span className="ml-1 font-mono text-[10px] text-faint">{r.pickupLabel.split(' · ')[0]}</span>
                </button>
              ))}
              {!waiting.length && <span className="text-xs text-faint">Queue clear.</span>}
            </div>
          </div>

          {/* CandidateLink ranking */}
          <div className="min-w-0 p-1">
            <div className="flex items-center justify-between px-2 pt-2 font-mono text-[10px] uppercase tracking-[0.16em] text-muted">
              <span>CandidateLink Ranking</span>
              {rider && <span className="truncate normal-case tracking-normal text-ink">{rider.name} · {rider.partySize} pax</span>}
            </div>
            <CandidateLinkRanking rider={rider} layout="row" />
          </div>

          {/* AWS queue health */}
          <div className="min-w-0 space-y-2 p-3">
            <div className="grid grid-cols-3 gap-2">
              <Metric label="SQS" value={t.queueDepth} hint={`${t.inFlight} in-flight`} />
              <Metric label="DLQ" value={t.dlqCount} tone={t.dlqCount ? 'alert' : 'ok'} />
              <Metric label="Audit" value={t.auditCount} />
            </div>
            <QueueMeter depth={t.queueDepth} inFlight={t.inFlight} />
            <ChaosActions size="sm" />
          </div>
        </div>
      </div>

      {/* Audit ticker */}
      <div className="glass pointer-events-auto absolute right-4 top-20 hidden w-[300px] rounded-xl border border-line xl:block">
        <div className="border-b border-line/70 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-muted">DynamoDB Audit</div>
        <AuditLog limit={6} className="max-h-[220px] py-1" />
      </div>
    </div>
  );
}

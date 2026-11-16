import type { ReactNode } from 'react';
import { DRIVER_STATUS_COLOR, RIDER_STATUS_COLOR } from '../domain/palette';
import type { AuditEntry, Driver, DriverStatus, Rider } from '../domain/types';
import {
  CAMERA_PRESETS,
  useCandidateLinks,
  useDispatchActions,
  useDispatchSnapshot,
  useGateway,
  useNow,
  useUi,
} from '../state/DispatchContext';

// ------------------------------------------------------------------ primitives

export function Card({ title, aside, children, className = '' }: { title?: string; aside?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-lg border border-line bg-card ${className}`}>
      {title && (
        <header className="flex items-center justify-between border-b border-line/70 px-3 py-2">
          <h3 className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">{title}</h3>
          {aside}
        </header>
      )}
      {children}
    </section>
  );
}

export function StatusPill({ status }: { status: DriverStatus }) {
  const c = DRIVER_STATUS_COLOR[status];
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full border px-1.5 py-px font-mono text-[10px] font-semibold"
      style={{ color: c, borderColor: `${c}55`, background: `${c}14` }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: c }} />
      {status.replace('_', ' ')}
    </span>
  );
}

function fmtAgo(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  if (s < 60) return `${s}s`;
  return `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, '0')}s`;
}

function fmtClock(ts: number): string {
  return new Date(ts).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

// ------------------------------------------------------------------ fleet + camera

export function FleetCounts({ compact = false }: { compact?: boolean }) {
  const { drivers, riders } = useDispatchSnapshot();
  const count = (s: DriverStatus) => drivers.filter((d) => d.status === s).length;
  const waiting = riders.filter((r) => r.status === 'WAITING').length;
  const items: Array<[string, number, string]> = [
    ['AVAILABLE', count('AVAILABLE'), DRIVER_STATUS_COLOR.AVAILABLE],
    ['EN ROUTE', count('EN_ROUTE'), DRIVER_STATUS_COLOR.EN_ROUTE],
    ['ON TRIP', count('ON_TRIP'), DRIVER_STATUS_COLOR.ON_TRIP],
    ['WAITING', waiting, RIDER_STATUS_COLOR.WAITING],
  ];
  return (
    <div className={`flex items-center ${compact ? 'gap-3' : 'gap-4'}`}>
      {items.map(([label, n, c]) => (
        <div key={label} className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full" style={{ background: c, boxShadow: `0 0 8px ${c}` }} />
          <span className="tabular font-mono text-xs font-semibold text-ink">{n}</span>
          {!compact && <span className="font-mono text-[10px] tracking-wider text-faint">{label}</span>}
        </div>
      ))}
    </div>
  );
}

export function CameraPresetTabs({ className = '' }: { className?: string }) {
  const ui = useUi();
  return (
    <div className={`flex items-center gap-0.5 rounded-md border border-line bg-canvas/60 p-0.5 ${className}`}>
      {CAMERA_PRESETS.map((p) => (
        <button
          key={p}
          type="button"
          onClick={() => ui.setCameraPreset(p)}
          className={`rounded px-2.5 py-1 text-xs transition-colors ${
            ui.cameraPreset === p ? 'bg-raised text-ink shadow-inner' : 'text-muted hover:text-ink'
          }`}
        >
          {p === 'Tour' && <span className="mr-1 text-available">●</span>}
          {p}
        </button>
      ))}
    </div>
  );
}

// ------------------------------------------------------------------ riders + candidate links

export function RiderQueue({ dense = false }: { dense?: boolean }) {
  const { riders } = useDispatchSnapshot();
  const ui = useUi();
  const now = useNow();
  const list = [...riders].sort((a, b) => (a.status === 'WAITING' ? -1 : 1) - (b.status === 'WAITING' ? -1 : 1) || a.requestedAt - b.requestedAt);
  if (!list.length) return <p className="px-3 py-4 text-xs text-faint">No Riders in the DispatchZone.</p>;
  return (
    <ul className="divide-y divide-line/50">
      {list.map((r) => {
        const active = ui.selectedRiderId === r.id;
        const c = RIDER_STATUS_COLOR[r.status];
        return (
          <li key={r.id}>
            <button
              type="button"
              onClick={() => ui.selectRider(active ? undefined : r.id)}
              className={`flex w-full items-center gap-2.5 px-3 text-left transition-colors ${dense ? 'py-1.5' : 'py-2'} ${
                active ? 'bg-rider/10' : 'hover:bg-raised'
              }`}
            >
              <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: c, boxShadow: r.status === 'WAITING' ? `0 0 8px ${c}` : undefined }} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] text-ink">
                  {r.name} <span className="text-faint">· {r.partySize} pax</span>
                </span>
                <span className="block truncate font-mono text-[10px] text-muted">
                  {r.pickupLabel} → {r.destination}
                </span>
              </span>
              <span className="tabular shrink-0 font-mono text-[10px]" style={{ color: r.status === 'WAITING' ? undefined : c }}>
                {r.status === 'WAITING' ? <span className="text-muted">{fmtAgo(now - r.requestedAt)}</span> : r.status.replace('_', ' ')}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

export function CandidateLinkRanking({ rider, layout = 'list' }: { rider?: Rider; layout?: 'list' | 'row' }) {
  const ui = useUi();
  const { drivers } = useDispatchSnapshot();
  const links = useCandidateLinks(rider?.id, 3);
  const { dispatch } = useDispatchActions();

  if (!rider) {
    return <p className="px-3 py-3 text-xs text-faint">Select a waiting Rider to rank CandidateLinks.</p>;
  }
  if (rider.status !== 'WAITING') {
    const d = drivers.find((x) => x.id === rider.assignedDriverId);
    return (
      <div className="px-3 py-3 text-xs text-muted">
        DispatchAssignment active · <span className="text-ink">{d?.callsign}</span> {d && <StatusPill status={d.status} />}
        {d && (
          <button type="button" className="ml-2 text-rider hover:underline" onClick={() => ui.selectDriver(d.id)}>
            Follow Driver
          </button>
        )}
      </div>
    );
  }
  if (!links.length) return <p className="px-3 py-3 text-xs text-ontrip">No AVAILABLE Driver within the max match radius.</p>;

  if (layout === 'row') {
    return (
      <ol className="grid grid-cols-3 gap-2 p-2">
        {links.map((l) => {
          const d = drivers.find((x) => x.id === l.driverId)!;
          const top = l.rank === 1;
          return (
            <li key={l.driverId} className={`rounded-md border p-2 ${top ? 'border-available/50 bg-available/[0.06]' : 'border-line bg-canvas/40'}`}>
              <div className="flex items-baseline gap-1.5 font-mono text-[11px]">
                <span className={`font-bold ${top ? 'text-available' : 'text-faint'}`}>#{l.rank}</span>
                <button type="button" onClick={() => ui.selectDriver(d.id)} className="truncate text-ink hover:underline">
                  {d.callsign}
                </button>
              </div>
              <div className="tabular mt-1 whitespace-nowrap font-mono text-[13px] text-ink">
                {l.distanceKm.toFixed(2)}
                <span className="text-[10px] text-muted"> km</span> · {l.etaMin}
                <span className="text-[10px] text-muted"> min</span>
              </div>
              <button
                type="button"
                onClick={() => dispatch(rider.id, d.id)}
                className={`mt-1.5 w-full rounded py-1 font-mono text-[10px] font-bold uppercase tracking-wider ${
                  top ? 'bg-available text-canvas hover:bg-available/85' : 'border border-line text-muted hover:border-available hover:text-available'
                }`}
              >
                Dispatch
              </button>
            </li>
          );
        })}
      </ol>
    );
  }

  return (
    <ol className="space-y-1.5 p-2">
      {links.map((l) => {
        const d = drivers.find((x) => x.id === l.driverId)!;
        const top = l.rank === 1;
        return (
          <li
            key={l.driverId}
            className={`group rounded-md border px-2.5 py-2 transition-colors ${top ? 'border-available/50 bg-available/[0.06]' : 'border-line bg-canvas/40'}`}
          >
            <div className="flex items-center gap-2">
              <span className={`font-mono text-xs font-bold ${top ? 'text-available' : 'text-faint'}`}>#{l.rank}</span>
              <button type="button" onClick={() => ui.selectDriver(d.id)} className="min-w-0 flex-1 truncate text-left text-[13px] text-ink hover:underline">
                {d.callsign} <span className="text-faint">· {d.name.split(' ')[0]}</span>
              </button>
              <span className="font-mono text-[10px] text-faint">{d.seats} seats</span>
            </div>
            <div className="mt-1.5 flex items-center gap-3">
              <span className="tabular font-mono text-sm text-ink">
                {l.distanceKm.toFixed(2)}
                <span className="ml-0.5 text-[10px] text-muted">km</span>
              </span>
              <span className="tabular font-mono text-sm text-ink">
                {l.etaMin}
                <span className="ml-0.5 text-[10px] text-muted">min</span>
              </span>
              <button
                type="button"
                onClick={() => dispatch(rider.id, d.id)}
                className={`ml-auto rounded px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-wider transition-colors ${
                  top ? 'bg-available text-canvas hover:bg-available/85' : 'border border-line text-muted hover:border-available hover:text-available'
                }`}
              >
                Dispatch
              </button>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

// ------------------------------------------------------------------ inspectors

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="font-mono text-[10px] uppercase tracking-wider text-faint">{label}</dt>
      <dd className="mt-0.5 text-[13px] text-ink">{children}</dd>
    </div>
  );
}

export function RiderInspector({ rider }: { rider: Rider }) {
  const now = useNow();
  return (
    <div>
      <div className="px-3 pb-2 pt-3">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: RIDER_STATUS_COLOR[rider.status] }} />
          <h2 className="text-base font-semibold text-ink">{rider.name}</h2>
          <span className="ml-auto font-mono text-[10px] text-faint">{rider.id}</span>
        </div>
        <dl className="mt-3 grid grid-cols-2 gap-3">
          <Field label="Pickup">{rider.pickupLabel}</Field>
          <Field label="Destination">{rider.destination}</Field>
          <Field label="Party">{rider.partySize} pax</Field>
          <Field label="Waiting">{rider.status === 'WAITING' ? fmtAgo(now - rider.requestedAt) : rider.status.replace('_', ' ')}</Field>
        </dl>
      </div>
      <div className="border-t border-line/70">
        <div className="px-3 pt-2 font-mono text-[10px] uppercase tracking-[0.16em] text-muted">Top 3 CandidateLinks</div>
        <CandidateLinkRanking rider={rider} />
      </div>
    </div>
  );
}

export function DriverInspector({ driver }: { driver: Driver }) {
  const { assignments, riders } = useDispatchSnapshot();
  const ui = useUi();
  const now = useNow();
  const current = assignments.find((a) => a.id === driver.assignmentId);
  const history = assignments.filter((a) => a.driverId === driver.id && a.status === 'COMPLETED').slice(0, 3);
  const rider = riders.find((r) => r.id === driver.riderId);
  const steps: DriverStatus[] = ['AVAILABLE', 'EN_ROUTE', 'ON_TRIP'];
  return (
    <div className="px-3 py-3">
      <div className="flex items-center gap-2">
        <h2 className="font-mono text-base font-semibold text-ink">{driver.callsign}</h2>
        <StatusPill status={driver.status} />
        <span className="ml-auto text-xs text-muted">{driver.name}</span>
      </div>
      <div className="mt-3 flex items-center gap-1">
        {steps.map((s, i) => {
          const reached = steps.indexOf(driver.status) >= i;
          return (
            <div key={s} className="flex flex-1 items-center gap-1">
              <div className="h-1 flex-1 rounded-full" style={{ background: reached ? DRIVER_STATUS_COLOR[s] : '#2a2927' }} />
            </div>
          );
        })}
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-3">
        <Field label="Seats">{driver.seats}</Field>
        <Field label="Position">
          <span className="tabular font-mono text-xs">
            {driver.position.x.toFixed(1)}, {driver.position.z.toFixed(1)}
          </span>
        </Field>
        {current && (
          <>
            <Field label="DispatchAssignment">
              <span className="font-mono text-xs">{current.id}</span>
            </Field>
            <Field label="Rider">
              {rider ? (
                <button type="button" className="text-rider hover:underline" onClick={() => ui.selectRider(rider.id)}>
                  {current.riderName}
                </button>
              ) : (
                current.riderName
              )}
            </Field>
            <Field label="Quoted">
              {current.distanceKm.toFixed(2)} km · {current.etaMin} min
            </Field>
            <Field label="Elapsed">{fmtAgo(now - current.createdAt)}</Field>
          </>
        )}
      </dl>
      {history.length > 0 && (
        <div className="mt-4">
          <div className="font-mono text-[10px] uppercase tracking-wider text-faint">Recent trips</div>
          <ul className="mt-1 space-y-0.5 text-xs text-muted">
            {history.map((a) => (
              <li key={a.id} className="flex justify-between font-mono">
                <span>{a.id}</span>
                <span>{a.riderName}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {driver.status === 'AVAILABLE' && <p className="mt-4 text-xs text-faint">Select a waiting Rider to see whether this Driver ranks as a CandidateLink.</p>}
    </div>
  );
}

export function SelectionInspector() {
  const ui = useUi();
  const { riders, drivers } = useDispatchSnapshot();
  const rider = riders.find((r) => r.id === ui.selectedRiderId);
  const driver = drivers.find((d) => d.id === ui.selectedDriverId);
  if (rider) return <RiderInspector rider={rider} />;
  if (driver) return <DriverInspector driver={driver} />;
  return null;
}

// ------------------------------------------------------------------ cloud telemetry + chaos

export function Metric({ label, value, tone = 'ink', hint }: { label: string; value: ReactNode; tone?: 'ink' | 'alert' | 'warn' | 'ok'; hint?: string }) {
  const color = { ink: 'text-ink', alert: 'text-ontrip', warn: 'text-enroute', ok: 'text-available' }[tone];
  return (
    <div className="min-w-0">
      <div className="truncate font-mono text-[10px] uppercase tracking-wider text-faint">{label}</div>
      <div className={`tabular font-mono text-xl font-semibold leading-tight ${color}`}>{value}</div>
      {hint && <div className="truncate font-mono text-[10px] text-faint">{hint}</div>}
    </div>
  );
}

export function QueueMeter({ depth, inFlight }: { depth: number; inFlight: number }) {
  const cap = 24;
  const total = Math.min(cap, depth + inFlight);
  return (
    <div className="flex h-1.5 w-full gap-px overflow-hidden rounded-full bg-canvas">
      {Array.from({ length: cap }, (_, i) => (
        <div
          key={i}
          className="flex-1 transition-colors duration-300"
          style={{ background: i < Math.min(depth, cap) ? '#38BDF8' : i < total ? '#FBBF24' : '#242322' }}
        />
      ))}
    </div>
  );
}

export function CloudTelemetry({ layout = 'grid' }: { layout?: 'grid' | 'row' }) {
  const { telemetry: t } = useDispatchSnapshot();
  const now = useNow();
  return (
    <div className={layout === 'row' ? 'flex items-end gap-5' : 'space-y-3 p-3'}>
      <div className={layout === 'row' ? 'flex items-end gap-5' : 'grid grid-cols-2 gap-3'}>
        <Metric label="SQS Queue Depth" value={t.queueDepth} hint={`${t.inFlight} in-flight`} />
        <Metric label="DLQ Count" value={t.dlqCount} tone={t.dlqCount ? 'alert' : 'ok'} hint={`maxReceive ${t.maxReceiveCount}`} />
        <Metric label="DynamoDB Audit" value={t.auditCount} hint="dispatch-audit items" />
        <Metric label="Processed" value={t.processed} hint={t.lastGpsTickAt ? `GPS ${fmtAgo(now - t.lastGpsTickAt)} ago` : 'no GPS tick yet'} />
      </div>
      {layout === 'grid' && <QueueMeter depth={t.queueDepth} inFlight={t.inFlight} />}
    </div>
  );
}

export function HealthBadge() {
  const { telemetry: t } = useDispatchSnapshot();
  const ok = t.health === 'HEALTHY';
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 font-mono text-[10px] font-semibold ${
        ok ? 'border-available/40 text-available' : 'dlq-flash border-ontrip/60 bg-ontrip/10 text-ontrip'
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${ok ? 'bg-available' : 'bg-ontrip'}`} />
      {ok ? 'HEALTHY' : `DEGRADED · DLQ ${t.dlqCount}`}
    </span>
  );
}

export function ChaosActions({ size = 'md', className = '' }: { size?: 'sm' | 'md'; className?: string }) {
  const { simulateGpsTick, injectPoisonPill, replayDlq, resetFleet } = useDispatchActions();
  const { telemetry } = useDispatchSnapshot();
  const base = size === 'sm' ? 'px-2 py-1 text-[11px]' : 'px-3 py-2 text-xs';
  return (
    <div className={`flex flex-wrap gap-1.5 ${className}`}>
      <button type="button" onClick={simulateGpsTick} className={`${base} rounded-md border border-line bg-raised font-medium text-ink hover:border-rider hover:text-rider`}>
        ⌖ Simulate GPS Tick
      </button>
      <button
        type="button"
        onClick={injectPoisonPill}
        className={`${base} rounded-md border border-ontrip/50 bg-ontrip/10 font-medium text-ontrip hover:bg-ontrip hover:text-canvas`}
      >
        ☠ Inject PoisonPill
      </button>
      <button
        type="button"
        onClick={replayDlq}
        disabled={!telemetry.dlqCount}
        className={`${base} rounded-md border border-line bg-raised font-medium text-ink enabled:hover:border-enroute enabled:hover:text-enroute disabled:cursor-not-allowed disabled:opacity-40`}
      >
        ↻ Replay DLQ{telemetry.dlqCount ? ` (${telemetry.dlqCount})` : ''}
      </button>
      <button type="button" onClick={resetFleet} className={`${base} rounded-md px-2 text-faint hover:text-ink`} title="Reset showcase fleet">
        Reset
      </button>
    </div>
  );
}

const SEVERITY_COLOR: Record<AuditEntry['severity'], string> = { info: 'text-muted', warn: 'text-enroute', error: 'text-ontrip' };

export function AuditLog({ limit = 30, className = '' }: { limit?: number; className?: string }) {
  const { telemetry } = useDispatchSnapshot();
  return (
    <ul className={`scroll-thin space-y-px overflow-y-auto font-mono text-[11px] ${className}`}>
      {telemetry.audit.slice(0, limit).map((e) => (
        <li key={e.id} className="grid grid-cols-[56px_1fr] gap-2 px-3 py-1 hover:bg-raised/60">
          <span className="tabular text-faint">{fmtClock(e.at)}</span>
          <span className="min-w-0">
            <span className={`font-semibold ${e.severity === 'info' ? 'text-ink' : SEVERITY_COLOR[e.severity]}`}>{e.type}</span>
            <span className={`block truncate ${SEVERITY_COLOR[e.severity]}`}>{e.detail}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

export function DlqPanel() {
  const { telemetry } = useDispatchSnapshot();
  if (!telemetry.dlqMessages.length) return <p className="px-3 py-2 font-mono text-[11px] text-faint">dispatch-events-dlq is empty.</p>;
  return (
    <ul className="space-y-1.5 p-2">
      {telemetry.dlqMessages.map((m) => (
        <li key={m.id} className="rounded-md border border-ontrip/40 bg-ontrip/[0.07] px-2.5 py-1.5 font-mono text-[10px]">
          <div className="flex justify-between text-ontrip">
            <span className="font-semibold">{m.id} · PoisonPill</span>
            <span>receives {m.receiveCount}</span>
          </div>
          <div className="mt-0.5 truncate text-muted">{m.payload}</div>
        </li>
      ))}
    </ul>
  );
}

export function DlqAlert({ className = '' }: { className?: string }) {
  const { telemetry } = useDispatchSnapshot();
  const { replayDlq } = useDispatchActions();
  if (!telemetry.dlqCount) return null;
  return (
    <div className={`dlq-flash flex items-center gap-3 rounded-lg border border-ontrip/60 bg-ontrip/15 px-3 py-2 text-xs text-ontrip ${className}`}>
      <span className="text-base">⚠</span>
      <span>
        <b>{telemetry.dlqCount}</b> PoisonPill message{telemetry.dlqCount > 1 ? 's' : ''} isolated in DLQ — consumer healthy, dispatch unaffected.
      </span>
      <button type="button" onClick={replayDlq} className="ml-auto rounded border border-ontrip/60 px-2 py-0.5 font-semibold hover:bg-ontrip hover:text-canvas">
        Replay DLQ
      </button>
    </div>
  );
}

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <div className="grid h-6 w-6 place-items-center rounded-md border border-line bg-raised">
        <div className="h-2 w-2 rotate-45 bg-available shadow-[0_0_10px_#4ADE80]" />
      </div>
      <div className="leading-tight">
        <div className="text-[13px] font-semibold tracking-tight text-ink">RideForce</div>
        {!compact && <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-faint">Airport Corridor · DispatchZone</div>}
      </div>
    </div>
  );
}

export function GatewayBadge() {
  const g = useGateway();
  useDispatchSnapshot(); // re-render on connection changes
  const c = g.getConnection();
  const tone =
    c === 'live' ? 'text-available border-available/40' : c === 'local' ? 'text-muted border-line' : c === 'connecting' ? 'text-enroute border-enroute/40' : 'text-ontrip border-ontrip/50';
  const label =
    g.kind === 'in-memory' ? 'InMemoryDispatchAdapter' : `HttpDispatchAdapter · ${c === 'live' ? 'aws-emulator' : c}`;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 font-mono text-[10px] ${tone}`} title={`DispatchGateway: ${g.kind}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${c === 'live' ? 'bg-available' : c === 'local' ? 'bg-faint' : c === 'connecting' ? 'bg-enroute' : 'bg-ontrip'}`} />
      {label}
    </span>
  );
}

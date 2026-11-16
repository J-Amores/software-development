import { useNow, useUi, useDispatchSnapshot } from '../state/DispatchContext';
import { DispatchViewport } from '../scene/DispatchViewport';
import { Brand, CameraPresetTabs, ChaosActions, DlqAlert, FleetCounts, HealthBadge, SelectionInspector } from '../hud/widgets';

/** Minimal floating top bar + bottom status bar; inspector slides over only on selection. */
export function TemplateClassic() {
  const ui = useUi();
  const { telemetry: t } = useDispatchSnapshot();
  const now = useNow();
  const open = Boolean(ui.selectedRiderId || ui.selectedDriverId);

  return (
    <div className="relative h-full w-full overflow-hidden">
      <DispatchViewport />

      {/* Floating top bar */}
      <div className="pointer-events-none absolute inset-x-0 top-4 flex justify-center px-4">
        <div className="glass pointer-events-auto flex items-center gap-5 rounded-xl border border-line px-3 py-2 shadow-2xl">
          <Brand />
          <div className="h-6 w-px bg-line" />
          <CameraPresetTabs />
          <div className="h-6 w-px bg-line" />
          <FleetCounts compact />
        </div>
      </div>

      <DlqAlert className="absolute left-1/2 top-20 w-[min(560px,calc(100%-32px))] -translate-x-1/2" />

      {/* Slide-over inspector */}
      <aside
        className={`glass absolute bottom-12 right-4 top-20 w-[340px] max-w-[calc(100%-32px)] overflow-y-auto rounded-xl border border-line shadow-2xl transition-transform duration-300 ease-out scroll-thin ${
          open ? 'translate-x-0' : 'translate-x-[calc(100%+24px)]'
        }`}
      >
        <div className="flex items-center justify-between border-b border-line/70 px-3 py-2">
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted">{ui.selectedRiderId ? 'Rider' : 'Driver'} Inspector</span>
          <button type="button" onClick={ui.clearSelection} className="text-faint hover:text-ink" aria-label="Close inspector">
            ✕
          </button>
        </div>
        <SelectionInspector />
      </aside>

      {/* Bottom status bar */}
      <footer className="glass absolute inset-x-0 bottom-0 flex h-9 items-center gap-5 border-t border-line px-4 font-mono text-[11px] text-muted">
        <HealthBadge />
        <span>
          SQS <b className="tabular text-ink">{t.queueDepth}</b>
          <span className="text-faint"> / {t.inFlight} in-flight</span>
        </span>
        <span className={t.dlqCount ? 'text-ontrip' : ''}>
          DLQ <b className="tabular">{t.dlqCount}</b>
        </span>
        <span>
          DynamoDB Audit <b className="tabular text-ink">{t.auditCount}</b>
        </span>
        <span className="hidden truncate lg:inline">{t.audit[0] ? `${t.audit[0].type} · ${t.audit[0].detail}` : ''}</span>
        <div className="ml-auto flex items-center gap-3">
          <ChaosActions size="sm" className="flex-nowrap" />
          <span className="tabular text-faint">{new Date(now).toLocaleTimeString([], { hour12: false })}</span>
        </div>
      </footer>
    </div>
  );
}

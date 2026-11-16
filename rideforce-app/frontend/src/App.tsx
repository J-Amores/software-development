import { useEffect, useState } from 'react';
import { GatewayBadge } from './hud/widgets';
import { DispatchProvider } from './state/DispatchContext';
import { RadarHud } from './variants/RadarHud';
import { TacticalSplit } from './variants/TacticalSplit';
import { TemplateClassic } from './variants/TemplateClassic';

const VARIANTS = [
  { id: 'template-classic', label: 'Template Classic', Component: TemplateClassic },
  { id: 'tactical-split', label: 'Tactical Split', Component: TacticalSplit },
  { id: 'radar-hud', label: 'Radar HUD', Component: RadarHud },
] as const;

type VariantId = (typeof VARIANTS)[number]['id'];

function readVariant(): VariantId {
  const v = new URLSearchParams(window.location.search).get('variant');
  return (VARIANTS.find((x) => x.id === v)?.id ?? 'template-classic') as VariantId;
}

function VariantSwitcher({ value, onChange }: { value: VariantId; onChange(v: VariantId): void }) {
  // Lift above each variant's own bottom chrome.
  const bottom = value === 'template-classic' ? 'bottom-12' : 'bottom-3';
  return (
    <nav className={`glass fixed left-1/2 z-50 flex -translate-x-1/2 items-center gap-1 rounded-full border border-line p-1 shadow-2xl ${bottom}`}>
      <span className="px-2 font-mono text-[10px] uppercase tracking-[0.16em] text-faint">Prototype</span>
      {VARIANTS.map((v, i) => (
        <button
          key={v.id}
          type="button"
          onClick={() => onChange(v.id)}
          className={`rounded-full px-3 py-1 text-xs transition-colors ${value === v.id ? 'bg-ink text-canvas' : 'text-muted hover:text-ink'}`}
          title={`?variant=${v.id} · key ${i + 1}`}
        >
          {v.label}
        </button>
      ))}
      <span className="ml-1 hidden pr-1 md:inline-flex">
        <GatewayBadge />
      </span>
    </nav>
  );
}

export function App() {
  const [variant, setVariant] = useState<VariantId>(readVariant);

  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set('variant', variant);
    window.history.replaceState(null, '', url);
  }, [variant]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.metaKey || e.ctrlKey) return;
      const idx = Number(e.key) - 1;
      if (VARIANTS[idx]) setVariant(VARIANTS[idx].id);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const { Component } = VARIANTS.find((v) => v.id === variant)!;
  return (
    <DispatchProvider>
      <div className="h-full w-full">
        <Component />
      </div>
      <VariantSwitcher value={variant} onChange={setVariant} />
    </DispatchProvider>
  );
}

/**
 * Lightweight 3D-anchored DOM labels.
 *
 * drei's <Html> creates a separate React root per label; under React 19 frequent mount/unmount
 * (hover chips, CandidateLink badges) races and can crash the canvas. Instead, labels are plain
 * DOM rendered in the main React tree outside <Canvas>, and a single projector moves them each frame.
 */
import { useFrame } from '@react-three/fiber';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Vector3 } from 'three';

type WorldFn = () => Vector3 | null;

interface Entry {
  world?: WorldFn;
  el?: HTMLElement | null;
}

class LabelRegistry {
  readonly entries = new Map<string, Entry>();

  private entry(id: string): Entry {
    let e = this.entries.get(id);
    if (!e) {
      e = {};
      this.entries.set(id, e);
    }
    return e;
  }

  setWorld(id: string, world?: WorldFn) {
    this.entry(id).world = world;
    this.gc(id);
  }

  setEl(id: string, el?: HTMLElement | null) {
    this.entry(id).el = el ?? undefined;
    this.gc(id);
  }

  private gc(id: string) {
    const e = this.entries.get(id);
    if (e && !e.world && !e.el) this.entries.delete(id);
  }
}

interface LabelCtx {
  registry: LabelRegistry;
  hovered?: string;
  setHovered(id?: string): void;
}

const Ctx = createContext<LabelCtx | null>(null);

export function LabelProvider({ children }: { children: ReactNode }) {
  const registry = useMemo(() => new LabelRegistry(), []);
  const [hovered, setHoveredState] = useState<string>();
  const setHovered = useCallback((id?: string) => setHoveredState(id), []);
  const value = useMemo(() => ({ registry, hovered, setHovered }), [registry, hovered, setHovered]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useLabels(): LabelCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error('useLabels must be used inside LabelProvider');
  return c;
}

/** Register a world-space anchor (call from inside the Canvas). `world` is read every frame. */
export function useAnchor(id: string, world: WorldFn) {
  const { registry } = useLabels();
  const fn = useRef(world);
  fn.current = world;
  useEffect(() => {
    registry.setWorld(id, () => fn.current());
    return () => registry.setWorld(id, undefined);
  }, [id, registry]);
}

/** Single per-frame projector; mount once inside the Canvas. */
export function LabelProjector() {
  const { registry } = useLabels();
  const v = useMemo(() => new Vector3(), []);
  useFrame(({ camera, size }) => {
    for (const e of registry.entries.values()) {
      if (!e.el) continue;
      const w = e.world?.();
      if (!w) {
        e.el.style.visibility = 'hidden';
        continue;
      }
      v.copy(w).project(camera);
      const onScreen = v.z > -1 && v.z < 1 && Math.abs(v.x) < 1.2 && Math.abs(v.y) < 1.2;
      const x = (v.x * 0.5 + 0.5) * size.width;
      const y = (-v.y * 0.5 + 0.5) * size.height;
      e.el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) translate(-50%, -50%)`;
      e.el.style.visibility = onScreen ? 'visible' : 'hidden';
      e.el.style.zIndex = String(Math.round((1 - v.z) * 10000));
    }
  });
  return null;
}

/** DOM label rendered outside the Canvas, positioned by LabelProjector. */
export function Label({ id, at, interactive = false, children }: { id: string; at?: [number, number, number]; interactive?: boolean; children: ReactNode }) {
  const { registry } = useLabels();
  const atKey = at?.join(',');
  useEffect(() => {
    if (!at) return;
    const p = new Vector3(...at);
    registry.setWorld(id, () => p);
    return () => registry.setWorld(id, undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, atKey, registry]);
  return (
    <div
      ref={(el) => registry.setEl(id, el)}
      className={`absolute left-0 top-0 will-change-transform ${interactive ? 'pointer-events-auto' : 'pointer-events-none'}`}
      style={{ visibility: 'hidden' }}
    >
      {children}
    </div>
  );
}

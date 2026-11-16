import { QuadraticBezierLine, type QuadraticBezierLineRef } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import { MathUtils, Vector3 } from 'three';
import { DRIVER_STATUS_COLOR } from '../domain/palette';
import type { CandidateLink, Driver, Rider, Vec2 } from '../domain/types';
import { ZONE } from '../domain/zone';
import { useGateway } from '../state/DispatchContext';
import { POSITION_DAMPING, SNAP_DISTANCE } from './DriverBeacon';
import { useAnchor } from './labels';

const LINK_Y = 0.9;
const BADGE_T = [0.5, 0.32, 0.68];

/** Damped driver anchor that tracks the DriverBeacon visual exactly. */
function useDriverAnchor(driverId: string) {
  const gateway = useGateway();
  const anchor = useRef<Vector3 | null>(null);
  return (dt: number): Vector3 | null => {
    const live = gateway.getLivePosition(driverId);
    if (!live) return anchor.current;
    if (!anchor.current || Math.hypot(live.x - anchor.current.x, live.z - anchor.current.z) > SNAP_DISTANCE) {
      anchor.current = new Vector3(live.x, LINK_Y, live.z);
    } else {
      anchor.current.x = MathUtils.damp(anchor.current.x, live.x, POSITION_DAMPING, dt);
      anchor.current.z = MathUtils.damp(anchor.current.z, live.z, POSITION_DAMPING, dt);
    }
    return anchor.current;
  };
}

function arcMid(a: Vector3, b: Vector3, lift: number, out: Vector3): Vector3 {
  out.lerpVectors(a, b, 0.5);
  out.y += lift + a.distanceTo(b) * 0.12;
  return out;
}

interface CandidateLinkArcProps {
  link: CandidateLink;
  rider: Rider;
  driver: Driver;
}

export function CandidateLinkArc({ link, rider, driver }: CandidateLinkArcProps) {
  const glow = useRef<QuadraticBezierLineRef>(null);
  const core = useRef<QuadraticBezierLineRef>(null);
  const badge = useRef(new Vector3()).current;
  const ready = useRef(false);
  useAnchor(`link:${link.driverId}`, () => (ready.current ? badge : null));
  const anchor = useDriverAnchor(link.driverId);
  const end = useRef(new Vector3(rider.pickup.x, LINK_Y + 0.9, rider.pickup.z)).current;
  const mid = useRef(new Vector3()).current;
  const top = link.rank === 1;
  const color = DRIVER_STATUS_COLOR.AVAILABLE;

  useFrame((_, dt) => {
    const start = anchor(dt);
    if (!start) return;
    arcMid(start, end, 1.5, mid);
    glow.current?.setPoints(start, end, mid);
    core.current?.setPoints(start, end, mid);
    if (core.current) {
      (core.current.material as unknown as { dashOffset: number }).dashOffset -= dt * 2.2;
    }
    {
      // Point on the quadratic Bézier; stagger t by rank so neighbouring badges don't stack.
      ready.current = true;
      const t = BADGE_T[link.rank - 1] ?? 0.5;
      const a = (1 - t) * (1 - t);
      const b = 2 * (1 - t) * t;
      const c = t * t;
      badge.set(a * start.x + b * mid.x + c * end.x, a * start.y + b * mid.y + c * end.y + 0.35, a * start.z + b * mid.z + c * end.z);
    }
  });

  return (
    <>
      <QuadraticBezierLine
        ref={glow}
        start={[driver.position.x, LINK_Y, driver.position.z]}
        end={end}
        color={color}
        lineWidth={top ? 9 : 6}
        transparent
        opacity={top ? 0.22 : 0.12}
        depthWrite={false}
        toneMapped={false}
      />
      <QuadraticBezierLine
        ref={core}
        start={[driver.position.x, LINK_Y, driver.position.z]}
        end={end}
        color={color}
        lineWidth={top ? 2.6 : 1.6}
        dashed
        dashSize={0.9}
        gapSize={0.45}
        transparent
        opacity={top ? 1 : 0.7}
        toneMapped={false}
      />
    </>
  );
}

/** Live route line for a Driver committed by a DispatchAssignment. */
export function AssignmentRoute({ driver, rider }: { driver: Driver; rider?: Rider }) {
  const line = useRef<QuadraticBezierLineRef>(null);
  const anchor = useDriverAnchor(driver.id);
  const mid = useRef(new Vector3()).current;
  const end = useRef(new Vector3()).current;
  const enRoute = driver.status === 'EN_ROUTE';
  const exit = ZONE.destinations.find((d) => d.label === rider?.destination)?.exit ?? 'east';
  const target: Vec2 = enRoute && rider ? rider.pickup : ZONE.exits[exit];
  const color = DRIVER_STATUS_COLOR[driver.status];

  useFrame((_, dt) => {
    const start = anchor(dt);
    if (!start || !line.current) return;
    end.set(target.x, 0.3, target.z);
    mid.lerpVectors(start, end, 0.5);
    mid.y = 0.3 + start.distanceTo(end) * 0.05;
    line.current.setPoints(new Vector3(start.x, 0.3, start.z), end, mid);
    (line.current.material as unknown as { dashOffset: number }).dashOffset -= dt * 3;
  });

  return (
    <QuadraticBezierLine
      ref={line}
      start={[driver.position.x, 0.3, driver.position.z]}
      end={[target.x, 0.3, target.z]}
      color={color}
      lineWidth={enRoute ? 2.2 : 1.4}
      dashed
      dashSize={0.5}
      gapSize={0.5}
      transparent
      opacity={enRoute ? 0.9 : 0.45}
      toneMapped={false}
    />
  );
}

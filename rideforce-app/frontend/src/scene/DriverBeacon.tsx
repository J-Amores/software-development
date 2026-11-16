import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { useRef } from 'react';
import { MathUtils, Vector3, type Group, type Mesh, type MeshBasicMaterial } from 'three';
import { DRIVER_STATUS_COLOR } from '../domain/palette';
import type { Driver } from '../domain/types';
import { useGateway } from '../state/DispatchContext';
import { useAnchor, useLabels } from './labels';

/** Shared damping so CandidateLink arcs track beacons exactly. */
export const POSITION_DAMPING = 9;
export const SNAP_DISTANCE = 8;

function shortestAngle(from: number, to: number): number {
  let d = (to - from) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return d;
}

interface Props {
  driver: Driver;
  selected: boolean;
  candidateRank?: number;
  onSelect(id: string): void;
}

export function DriverBeacon({ driver, selected, candidateRank, onSelect }: Props) {
  const gateway = useGateway();
  const group = useRef<Group>(null);
  const body = useRef<Group>(null);
  const ring = useRef<Mesh>(null);
  const beam = useRef<MeshBasicMaterial>(null);
  const { hovered: hoveredId, setHovered } = useLabels();
  const hovered = hoveredId === `driver:${driver.id}`;
  const anchor = useRef(new Vector3()).current;
  useAnchor(`driver:${driver.id}`, () => (group.current ? anchor.copy(group.current.position).setY(4.75) : null));
  const color = DRIVER_STATUS_COLOR[driver.status];
  const initial = useRef(true);

  useFrame((state, dt) => {
    const live = gateway.getLivePosition(driver.id);
    const g = group.current;
    if (!live || !g || !body.current) return;
    const dist = Math.hypot(live.x - g.position.x, live.z - g.position.z);
    if (initial.current || dist > SNAP_DISTANCE) {
      g.position.set(live.x, 0, live.z);
      body.current.rotation.y = live.heading;
      initial.current = false;
    } else {
      g.position.x = MathUtils.damp(g.position.x, live.x, POSITION_DAMPING, dt);
      g.position.z = MathUtils.damp(g.position.z, live.z, POSITION_DAMPING, dt);
      const r = body.current.rotation.y;
      body.current.rotation.y = r + shortestAngle(r, live.heading) * Math.min(1, dt * 8);
    }
    const t = state.clock.elapsedTime;
    if (ring.current) {
      const s = selected ? 1.25 + Math.sin(t * 4) * 0.08 : candidateRank ? 1.1 + Math.sin(t * 3) * 0.06 : 1;
      ring.current.scale.setScalar(s);
    }
    if (beam.current) {
      beam.current.opacity = (driver.status === 'AVAILABLE' ? 0.35 : 0.6) + Math.sin(t * 5 + g.position.x) * 0.08;
    }
  });

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    onSelect(driver.id);
  };

  return (
    <group
      ref={group}
      onClick={handleClick}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(`driver:${driver.id}`);
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        setHovered(undefined);
        document.body.style.cursor = '';
      }}
    >
      <group ref={body}>
        <mesh position={[0, 0.32, 0]} castShadow>
          <boxGeometry args={[0.95, 0.38, 1.8]} />
          <meshStandardMaterial color="#2c2b29" metalness={0.5} roughness={0.35} />
        </mesh>
        <mesh position={[0, 0.66, -0.1]} castShadow>
          <boxGeometry args={[0.82, 0.3, 0.95]} />
          <meshStandardMaterial color="#141414" metalness={0.6} roughness={0.2} />
        </mesh>
        <mesh position={[0, 0.84, -0.1]}>
          <boxGeometry args={[0.55, 0.07, 0.22]} />
          <meshBasicMaterial color={color} toneMapped={false} />
        </mesh>
        {/* headlights */}
        <mesh position={[0, 0.34, 0.91]}>
          <boxGeometry args={[0.7, 0.08, 0.02]} />
          <meshBasicMaterial color="#fff6dd" toneMapped={false} />
        </mesh>
      </group>
      {/* beacon beam */}
      <mesh position={[0, 2.4, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 3, 8]} />
        <meshBasicMaterial ref={beam} color={color} transparent opacity={0.5} depthWrite={false} toneMapped={false} />
      </mesh>
      <mesh position={[0, 4, 0]}>
        <sphereGeometry args={[selected || hovered ? 0.26 : 0.18, 16, 16]} />
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>
      {/* ground ring */}
      <mesh ref={ring} position={[0, 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.05, selected ? 1.35 : 1.18, 40]} />
        <meshBasicMaterial color={color} transparent opacity={selected ? 0.95 : candidateRank ? 0.7 : 0.3} depthWrite={false} toneMapped={false} />
      </mesh>
      {/* generous hit area */}
      <mesh position={[0, 1.6, 0]}>
        <cylinderGeometry args={[1.1, 1.1, 3.6, 10]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  );
}

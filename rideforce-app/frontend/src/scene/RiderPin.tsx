import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import type { Group, Mesh, MeshBasicMaterial } from 'three';
import { RIDER_STATUS_COLOR } from '../domain/palette';
import type { Rider } from '../domain/types';
import { useLabels } from './labels';

interface Props {
  rider: Rider;
  selected: boolean;
  onSelect(id: string): void;
}

export function RiderPin({ rider, selected, onSelect }: Props) {
  const pin = useRef<Group>(null);
  const pulse = useRef<Mesh>(null);
  const pulseMat = useRef<MeshBasicMaterial>(null);
  const { hovered: hoveredId, setHovered } = useLabels();
  const hovered = hoveredId === `rider:${rider.id}`;
  const color = RIDER_STATUS_COLOR[rider.status];
  const waiting = rider.status === 'WAITING';

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (pin.current) pin.current.position.y = Math.sin(t * 2.2 + rider.pickup.x) * 0.12;
    if (pulse.current && pulseMat.current) {
      const phase = (t * (waiting ? 0.75 : 0.4) + rider.pickup.x * 0.1) % 1;
      pulse.current.scale.setScalar(0.6 + phase * (selected ? 3.2 : 2.4));
      pulseMat.current.opacity = (1 - phase) * (selected ? 0.9 : 0.6);
    }
  });

  return (
    <group
      position={[rider.pickup.x, 0, rider.pickup.z]}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(rider.id);
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(`rider:${rider.id}`);
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        setHovered(undefined);
        document.body.style.cursor = '';
      }}
    >
      <mesh ref={pulse} position={[0, 0.07, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.55, 0.7, 40]} />
        <meshBasicMaterial ref={pulseMat} color={color} transparent depthWrite={false} toneMapped={false} />
      </mesh>
      <mesh position={[0, 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.45, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.35} depthWrite={false} toneMapped={false} />
      </mesh>
      <group ref={pin}>
        <mesh position={[0, 1.05, 0]} rotation={[Math.PI, 0, 0]} castShadow>
          <coneGeometry args={[0.32, 1.1, 20]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.55} roughness={0.3} />
        </mesh>
        <mesh position={[0, 1.78, 0]} castShadow>
          <sphereGeometry args={[selected || hovered ? 0.42 : 0.34, 24, 24]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.8} roughness={0.25} />
        </mesh>
        <mesh position={[0, 1.78, 0]}>
          <sphereGeometry args={[0.14, 12, 12]} />
          <meshBasicMaterial color="#0b1820" />
        </mesh>
      </group>
      <mesh position={[0, 1.2, 0]}>
        <cylinderGeometry args={[0.9, 0.9, 2.6, 10]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  );
}

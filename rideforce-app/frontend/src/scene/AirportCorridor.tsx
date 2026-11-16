import { Grid } from '@react-three/drei';
import { memo } from 'react';
import { ZONE } from '../domain/zone';

const ASPHALT = '#1c1c1c';
const CONCRETE = '#242322';
const STRUCTURE = '#2a2927';
const MARKING = '#5c5850';

function Slab({ x, z, w, d, color = ASPHALT, y = 0.02 }: { x: number; z: number; w: number; d: number; color?: string; y?: number }) {
  return (
    <mesh position={[x, y, z]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[w, d]} />
      <meshStandardMaterial color={color} roughness={0.95} />
    </mesh>
  );
}

function Dashes({ z, from, to, step = 3, len = 1.4, y = 0.04 }: { z: number; from: number; to: number; step?: number; len?: number; y?: number }) {
  const xs: number[] = [];
  for (let x = from; x <= to; x += step) xs.push(x);
  return (
    <>
      {xs.map((x) => (
        <mesh key={x} position={[x, y, z]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[len, 0.12]} />
          <meshBasicMaterial color={MARKING} />
        </mesh>
      ))}
    </>
  );
}

function Aircraft({ x, z, rot = 0 }: { x: number; z: number; rot?: number }) {
  return (
    <group position={[x, 0, z]} rotation={[0, rot, 0]}>
      <mesh position={[0, 1.3, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <capsuleGeometry args={[0.75, 9, 6, 12]} />
        <meshStandardMaterial color="#d8d5cf" roughness={0.5} metalness={0.2} />
      </mesh>
      <mesh position={[0, 1.1, 0.6]} castShadow>
        <boxGeometry args={[11, 0.14, 2]} />
        <meshStandardMaterial color="#c9c5be" roughness={0.6} />
      </mesh>
      <mesh position={[0, 1.4, 4.4]} castShadow>
        <boxGeometry args={[3.8, 0.1, 1]} />
        <meshStandardMaterial color="#c9c5be" />
      </mesh>
      <mesh position={[0, 2.5, 4.6]} castShadow>
        <boxGeometry args={[0.12, 2.2, 1.3]} />
        <meshStandardMaterial color="#3a3834" />
      </mesh>
    </group>
  );
}

export const ZONE_LABELS: Array<{ id: string; text: string; at: [number, number, number] }> = [
  { id: 'zone:terminal', text: 'Terminal Pickup', at: [-2, 6.4, -9] },
  { id: 'zone:staging', text: 'Staging Lot', at: [20, 0.6, 18.8] },
  { id: 'zone:corridor', text: 'Airport Corridor · Route 09', at: [0, 0.6, 4.6] },
  { id: 'zone:runway', text: 'Runway 09R', at: [-36, 0.6, -31] },
];

/** Static geometry for the Airport Corridor DispatchZone. */
export const AirportCorridor = memo(function AirportCorridor() {
  return (
    <group>
      {/* Ground + grid */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
        <planeGeometry args={[240, 240]} />
        <meshStandardMaterial color="#121212" roughness={1} />
      </mesh>
      <Grid
        position={[0, 0, 0]}
        args={[240, 240]}
        cellSize={1}
        cellThickness={0.5}
        cellColor="#201f1d"
        sectionSize={8}
        sectionThickness={1}
        sectionColor="#3A3834"
        fadeDistance={130}
        fadeStrength={1.6}
        infiniteGrid
      />

      {/* Runway + taxiway */}
      <Slab x={0} z={-31} w={96} d={6} color="#191919" />
      <Dashes z={-31} from={-44} to={44} step={5} len={2.6} />
      <Slab x={0} z={-23.5} w={70} d={5} color="#1a1a1a" />

      {/* Terminal */}
      <mesh position={[0, 2.6, -14.5]} castShadow receiveShadow>
        <boxGeometry args={[46, 5.2, 8]} />
        <meshStandardMaterial color={STRUCTURE} roughness={0.8} />
      </mesh>
      <mesh position={[0, 2.4, -10.45]}>
        <boxGeometry args={[44, 3, 0.1]} />
        <meshStandardMaterial color="#1d2a33" emissive="#16303d" emissiveIntensity={0.6} roughness={0.2} metalness={0.6} />
      </mesh>
      <mesh position={[0, 5.4, -14.5]} castShadow>
        <boxGeometry args={[47, 0.4, 9]} />
        <meshStandardMaterial color="#33312e" />
      </mesh>
      {/* Curbside canopy */}
      <mesh position={[-2, 4.2, -8.7]} castShadow>
        <boxGeometry args={[42, 0.18, 3.4]} />
        <meshStandardMaterial color="#2f2d2a" />
      </mesh>
      {[-20, -14, -6, 2, 10, 17].map((x) => (
        <mesh key={x} position={[x, 2.1, -7.3]} castShadow>
          <cylinderGeometry args={[0.12, 0.12, 4.2, 8]} />
          <meshStandardMaterial color="#3a3834" />
        </mesh>
      ))}
      {/* Pickup doors */}
      {ZONE.pickupPoints.map((p) => (
        <mesh key={p.label} position={[p.x, 1.2, -10.4]}>
          <boxGeometry args={[2.4, 2.4, 0.12]} />
          <meshStandardMaterial color="#0f1a20" emissive="#38bdf8" emissiveIntensity={0.18} />
        </mesh>
      ))}

      {/* Jet bridges + aircraft */}
      {[-14, 0, 14].map((x) => (
        <group key={x}>
          <mesh position={[x, 2.4, -19.6]} castShadow>
            <boxGeometry args={[1.4, 1.4, 2.8]} />
            <meshStandardMaterial color="#33312e" />
          </mesh>
          <Aircraft x={x + 3.2} z={-22.5} rot={Math.PI / 2} />
        </group>
      ))}

      {/* Sidewalk + curb lane */}
      <Slab x={-2} z={-8.6} w={44} d={2.6} color={CONCRETE} y={0.03} />
      <Slab x={0} z={-5.4} w={56} d={3.6} />
      <Dashes z={-4} from={-27} to={27} step={2.5} len={1} />

      {/* Main corridor */}
      <Slab x={0} z={1} w={80} d={5.4} />
      <Dashes z={1} from={-38} to={38} />
      <mesh position={[0, 0.05, -1.75]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[80, 0.1]} />
        <meshBasicMaterial color="#4a463f" />
      </mesh>
      <mesh position={[0, 0.05, 3.75]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[80, 0.1]} />
        <meshBasicMaterial color="#4a463f" />
      </mesh>
      {/* Connector: corridor <-> curb */}
      <Slab x={-29} z={-2} w={4} d={6} />
      <Slab x={29} z={-2} w={4} d={6} />

      {/* Staging Lot */}
      <Slab x={20} z={11.9} w={18} d={11.6} color="#1a1a1a" />
      <Slab x={20} z={5.2} w={4} d={2.2} />
      {ZONE.stagingSlots.map((s, i) => (
        <mesh key={i} position={[s.x - 1.3, 0.04, s.z]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.08, 2.6]} />
          <meshBasicMaterial color={MARKING} />
        </mesh>
      ))}
      {/* lot lamp posts */}
      {[11.5, 28.5].map((x) =>
        [7, 17].map((z) => (
          <group key={`${x}-${z}`} position={[x, 0, z]}>
            <mesh position={[0, 1.8, 0]}>
              <cylinderGeometry args={[0.06, 0.08, 3.6, 6]} />
              <meshStandardMaterial color="#3a3834" />
            </mesh>
            <mesh position={[0, 3.65, 0]}>
              <sphereGeometry args={[0.16, 10, 10]} />
              <meshBasicMaterial color="#fff3d6" toneMapped={false} />
            </mesh>
          </group>
        )),
      )}

      {/* Control tower */}
      <group position={[-24, 0, 12]}>
        <mesh position={[0, 5, 0]} castShadow>
          <cylinderGeometry args={[0.9, 1.3, 10, 16]} />
          <meshStandardMaterial color={STRUCTURE} />
        </mesh>
        <mesh position={[0, 10.6, 0]} castShadow>
          <cylinderGeometry args={[2, 1.4, 1.4, 16]} />
          <meshStandardMaterial color="#1d2a33" emissive="#22d3ee" emissiveIntensity={0.25} metalness={0.5} roughness={0.2} />
        </mesh>
        <mesh position={[0, 11.5, 0]}>
          <cylinderGeometry args={[2.1, 2.1, 0.3, 16]} />
          <meshStandardMaterial color="#33312e" />
        </mesh>
      </group>

      {/* Parking structure (west) */}
      <mesh position={[-14, 1.6, 12]} castShadow receiveShadow>
        <boxGeometry args={[12, 3.2, 8]} />
        <meshStandardMaterial color="#222120" roughness={0.9} />
      </mesh>

    </group>
  );
});

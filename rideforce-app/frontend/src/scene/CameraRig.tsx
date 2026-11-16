import { OrbitControls } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import { Vector3 } from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import type { CameraPreset } from '../state/DispatchContext';

export const PRESET_POSES: Record<CameraPreset, { position: [number, number, number]; target: [number, number, number] }> = {
  Tour: { position: [42, 32, 42], target: [0, 0, -2] },
  'Terminal Pickup': { position: [-3, 15, 17], target: [-2, 0, -7] },
  'Staging Lot': { position: [30, 17, 28], target: [19, 0, 10] },
};

const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export function CameraRig({ preset }: { preset: CameraPreset }) {
  const controls = useRef<OrbitControlsImpl>(null);
  const { camera } = useThree();
  const anim = useRef({
    t: 1,
    fromPos: new Vector3(),
    toPos: new Vector3(),
    fromTarget: new Vector3(),
    toTarget: new Vector3(),
  });

  useEffect(() => {
    const c = controls.current;
    const a = anim.current;
    const pose = PRESET_POSES[preset];
    a.fromPos.copy(camera.position);
    a.fromTarget.copy(c ? c.target : new Vector3());
    a.toPos.set(...pose.position);
    a.toTarget.set(...pose.target);
    a.t = 0;
  }, [preset, camera]);

  useFrame((_, dt) => {
    const c = controls.current;
    const a = anim.current;
    if (!c) return;
    if (a.t < 1) {
      a.t = Math.min(1, a.t + dt / 1.6);
      const e = easeInOutCubic(a.t);
      camera.position.lerpVectors(a.fromPos, a.toPos, e);
      c.target.lerpVectors(a.fromTarget, a.toTarget, e);
    }
    c.autoRotate = preset === 'Tour' && a.t >= 1;
    c.update();
  });

  return (
    <OrbitControls
      ref={controls}
      makeDefault
      enableDamping
      dampingFactor={0.08}
      autoRotateSpeed={0.45}
      maxPolarAngle={Math.PI / 2.2}
      minDistance={6}
      maxDistance={120}
      onStart={() => {
        anim.current.t = 1;
      }}
    />
  );
}

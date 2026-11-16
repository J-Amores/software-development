import type { Vec2 } from './types';

export interface PickupPoint extends Vec2 {
  label: string;
}

export interface Destination {
  label: string;
  exit: 'east' | 'west';
}

const stagingSlots: Vec2[] = [];
for (let row = 0; row < 3; row++) {
  for (let col = 0; col < 6; col++) {
    stagingSlots.push({ x: 13.5 + col * 2.6, z: 8.5 + row * 3.4 });
  }
}

/** The Airport Corridor DispatchZone. 1 world unit = 40 m. */
export const ZONE = {
  id: 'airport-corridor',
  name: 'Airport Corridor',
  unitKm: 0.04,
  avgSpeedKmh: 28,
  maxMatchRadiusKm: 2.4,
  /** Lane the curbside pickup stops on (Rider pins sit on the sidewalk behind it). */
  curbLaneZ: -5.6,
  corridorLaneZ: 1,
  pickupPoints: [
    { label: 'Door 1 · Arrivals', x: -18, z: -8.4 },
    { label: 'Door 2 · Arrivals', x: -10, z: -8.4 },
    { label: 'Door 3 · Intl', x: -2, z: -8.4 },
    { label: 'Door 4 · Intl', x: 6, z: -8.4 },
    { label: 'Door 5 · Domestic', x: 14, z: -8.4 },
  ] satisfies PickupPoint[],
  stagingSlots,
  exits: { east: { x: 36, z: 1 }, west: { x: -36, z: 1 } } as Record<'east' | 'west', Vec2>,
  destinations: [
    { label: 'Downtown Core', exit: 'east' },
    { label: 'Harbor District', exit: 'west' },
    { label: 'Convention Center', exit: 'east' },
    { label: 'University Hill', exit: 'west' },
    { label: 'Tech Park North', exit: 'east' },
  ] satisfies Destination[],
} as const;

export function unitsToKm(units: number): number {
  return units * ZONE.unitKm;
}

export function etaMinutes(km: number): number {
  return Math.max(1, Math.round((km / ZONE.avgSpeedKmh) * 60 + 0.5));
}

import type { CandidateLink, Driver, Rider, Vec2 } from './types';
import { ZONE, etaMinutes, unitsToKm } from './zone';

/** Rank the nearest AVAILABLE Drivers (within the max match radius) for a waiting Rider. */
export function rankCandidateLinks(
  rider: Rider,
  drivers: Driver[],
  positionOf: (driver: Driver) => Vec2,
  limit = 3,
  maxMatchRadiusKm: number = ZONE.maxMatchRadiusKm,
): CandidateLink[] {
  if (rider.status !== 'WAITING') return [];
  return drivers
    .filter((d) => d.status === 'AVAILABLE' && d.seats >= rider.partySize)
    .map((d) => {
      const p = positionOf(d);
      const km = unitsToKm(Math.hypot(p.x - rider.pickup.x, p.z - rider.pickup.z));
      return { riderId: rider.id, driverId: d.id, rank: 0, distanceKm: Math.round(km * 100) / 100, etaMin: etaMinutes(km) };
    })
    .filter((l) => l.distanceKm <= maxMatchRadiusKm)
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, limit)
    .map((l, i) => ({ ...l, rank: i + 1 }));
}

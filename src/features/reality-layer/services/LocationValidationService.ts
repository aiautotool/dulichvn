import { getDistanceKm, type Coordinates } from '../../../lib/location/distance';

export type LocationValidationResult = {
  ok: boolean;
  distanceMeters: number | null;
  reason?: string;
};

export class LocationValidationService {
  distanceMeters(from: Coordinates, to: Coordinates): number {
    return Math.round(getDistanceKm(from, to) * 1000);
  }

  validateProximity(
    actorLocation: Coordinates | null | undefined,
    targetLocation: Coordinates | null | undefined,
    maxDistanceMeters: number,
  ): LocationValidationResult {
    if (!actorLocation || !targetLocation) {
      return { ok: false, distanceMeters: null, reason: 'location_missing' };
    }
    const distanceMeters = this.distanceMeters(actorLocation, targetLocation);
    return {
      ok: distanceMeters <= maxDistanceMeters,
      distanceMeters,
      reason: distanceMeters <= maxDistanceMeters ? undefined : 'too_far_from_place',
    };
  }

  hasImpossibleJump(
    previous: { location: Coordinates; timestamp: number } | null | undefined,
    next: { location: Coordinates; timestamp: number },
    maxSpeedKmh = 160,
  ): boolean {
    if (!previous) return false;
    const hours = Math.max((next.timestamp - previous.timestamp) / 3_600_000, 0.001);
    const speedKmh = getDistanceKm(previous.location, next.location) / hours;
    return speedKmh > maxSpeedKmh;
  }
}

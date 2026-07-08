import { getDistanceKm } from '../../../lib/location/distance';
import type { GeoPoint, ScamCategory, ScamReport } from '../types';

export type ScamRadarItem = {
  category: ScamCategory;
  count: number;
  nearestMeters: number;
  risk: 'low' | 'medium' | 'high';
};

export class ScamRadarService {
  listNearby(userLocation: GeoPoint, reports: ScamReport[], radiusMeters: number, now = Date.now()): ScamRadarItem[] {
    const maxAgeMs = 7 * 24 * 60 * 60 * 1000;
    const groups = new Map<ScamCategory, { count: number; nearestMeters: number }>();
    for (const report of reports) {
      if (report.status !== 'active' || now - report.createdAt > maxAgeMs) continue;
      const distanceMeters = Math.round(getDistanceKm(userLocation, { lat: report.latitude, lng: report.longitude }) * 1000);
      if (distanceMeters > radiusMeters) continue;
      const current = groups.get(report.category) ?? { count: 0, nearestMeters: Number.MAX_SAFE_INTEGER };
      groups.set(report.category, { count: current.count + 1, nearestMeters: Math.min(current.nearestMeters, distanceMeters) });
    }
    return Array.from(groups.entries()).map(([category, value]) => ({
      category,
      count: value.count,
      nearestMeters: value.nearestMeters,
      risk: value.count >= 5 ? 'high' : value.count >= 2 ? 'medium' : 'low',
    }));
  }
}

import type { PlaceRealityStatus, PriceReport, RealityScore, ScamReport, VerifiedPlacePhoto } from '../types';

export type RealityScoreInput = {
  placeId: string;
  statuses: PlaceRealityStatus[];
  photos: VerifiedPlacePhoto[];
  priceReports: PriceReport[];
  scamReports: ScamReport[];
  now?: number;
};

const clampScore = (value: number) => Math.max(0, Math.min(10, Math.round(value * 10) / 10));
const ageWeight = (createdAt: number, now: number, decayHours = 24) => Math.exp(-Math.max(0, now - createdAt) / 3_600_000 / decayHours);

function weightedAverage(items: Array<{ score: number; weight: number }>, fallback: number): number {
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
  if (totalWeight <= 0) return fallback;
  return items.reduce((sum, item) => sum + item.score * item.weight, 0) / totalWeight;
}

export class RealityScoreService {
  calculate(input: RealityScoreInput): RealityScore {
    const now = input.now ?? Date.now();
    const crowdScore = weightedAverage(
      input.statuses.map((status) => ({
        score: status.closed || status.restricted ? 2 : this.crowdToScore(status.crowdLevel),
        weight: ageWeight(status.createdAt, now),
      })),
      7,
    );
    const photoRealityScore = weightedAverage(
      input.photos.map((photo) => ({ score: photo.locationVerified ? 9 : 6, weight: ageWeight(photo.serverCreatedAt, now, 48) })),
      6.5,
    );
    const touristSafetyScore = clampScore(9 - Math.min(6, input.scamReports.filter((report) => report.status === 'active').length * 0.8));
    const priceFairnessScore = clampScore(8 - Math.min(4, input.priceReports.filter((report) => report.verified).length * 0.15));
    const localConfidenceScore = clampScore(Math.min(9.5, 4 + input.statuses.length * 0.8 + input.photos.length * 0.7));
    const overallScore = clampScore(
      photoRealityScore * 0.25 + crowdScore * 0.25 + priceFairnessScore * 0.15 + touristSafetyScore * 0.2 + localConfidenceScore * 0.15,
    );
    const realityGap = overallScore >= 8 ? 'low' : overallScore >= 6 ? 'medium' : 'high';

    return {
      placeId: input.placeId,
      overallScore,
      photoRealityScore: clampScore(photoRealityScore),
      crowdScore: clampScore(crowdScore),
      priceFairnessScore,
      touristSafetyScore,
      localConfidenceScore,
      realityGap,
      sampleSize: input.statuses.length + input.photos.length + input.priceReports.length + input.scamReports.length,
      calculatedAt: now,
    };
  }

  private crowdToScore(crowdLevel: PlaceRealityStatus['crowdLevel']): number {
    if (crowdLevel === 'empty') return 8.5;
    if (crowdLevel === 'normal') return 9;
    if (crowdLevel === 'crowded') return 6;
    return 3.5;
  }
}

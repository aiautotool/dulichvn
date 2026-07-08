import { RealityScoreService } from './RealityScoreService';
import { ShouldIGoNowService } from './ShouldIGoNowService';
import type { PlaceRealityStatus, PriceReport, ScamReport, TravelDecision, VerifiedPlacePhoto } from '../types';

export type DemoRealityLayer = {
  status: PlaceRealityStatus;
  photos: VerifiedPlacePhoto[];
  priceReports: PriceReport[];
  scamReports: ScamReport[];
  score: ReturnType<RealityScoreService['calculate']>;
  decision: TravelDecision;
};

export function buildDemoRealityLayer(place: { id: string; name: string; lat: number; lng: number }): DemoRealityLayer {
  const now = Date.now();
  const crowdedSeed = Math.abs(place.id.split('').reduce((sum, ch) => sum + ch.charCodeAt(0), 0)) % 4;
  const crowdLevels: PlaceRealityStatus['crowdLevel'][] = ['normal', 'crowded', 'normal', 'very_crowded'];
  const status: PlaceRealityStatus = {
    id: `status-${place.id}`,
    placeId: place.id,
    crowdLevel: crowdLevels[crowdedSeed],
    weatherCondition: crowdedSeed === 1 ? 'cloudy' : 'clear',
    temperature: 30 + crowdedSeed,
    touristTrapRisk: crowdedSeed >= 2 ? 'medium' : 'low',
    taxiRisk: crowdedSeed >= 2 ? 'high' : 'medium',
    submittedBy: 'demo-local-helper',
    latitude: place.lat,
    longitude: place.lng,
    createdAt: now - (8 + crowdedSeed * 6) * 60_000,
  };
  const photos: VerifiedPlacePhoto[] = [
    { id: `photo-${place.id}-1`, placeId: place.id, uri: '', shotType: 'crowd', helperId: 'demo-local-helper', capturedAt: now - 14 * 60_000, serverCreatedAt: now - 13 * 60_000, latitude: place.lat, longitude: place.lng, locationVerified: true },
  ];
  const priceReports: PriceReport[] = [
    { id: 'price-1', itemName: 'Coconut coffee', normalizedItemName: 'coconut coffee', price: 55000, currency: 'VND', placeId: place.id, submittedBy: 'demo', createdAt: now - 2 * 60 * 60_000, verified: true },
  ];
  const scamReports: ScamReport[] = crowdedSeed >= 2 ? [
    { id: `scam-${place.id}-1`, category: 'taxi_overcharging', reporterId: 'demo', placeId: place.id, latitude: place.lat, longitude: place.lng, createdAt: now - 3 * 60 * 60_000, verificationCount: 2, status: 'active' },
    { id: `scam-${place.id}-2`, category: 'tourist_price', reporterId: 'demo', placeId: place.id, latitude: place.lat, longitude: place.lng, createdAt: now - 5 * 60 * 60_000, verificationCount: 1, status: 'active' },
  ] : [];
  const score = new RealityScoreService().calculate({ placeId: place.id, statuses: [status], photos, priceReports, scamReports, now });
  const decision = new ShouldIGoNowService().decide({ destination: place, realityStatus: status, realityScore: score, recentScamReports: scamReports, recentPriceReports: priceReports, recentPhotos: photos });
  return { status, photos, priceReports, scamReports, score, decision };
}

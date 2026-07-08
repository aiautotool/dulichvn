export type GeoPoint = {
  lat: number;
  lng: number;
};

export type CrowdLevel = 'empty' | 'normal' | 'crowded' | 'very_crowded';
export type WeatherCondition = 'clear' | 'cloudy' | 'light_rain' | 'heavy_rain';
export type RiskLevel = 'low' | 'medium' | 'high';

export type PlaceRealityStatus = {
  id: string;
  placeId: string;
  crowdLevel: CrowdLevel;
  weatherCondition: WeatherCondition;
  temperature?: number;
  touristTrapRisk: RiskLevel;
  taxiRisk: RiskLevel;
  construction?: boolean;
  closed?: boolean;
  restricted?: boolean;
  submittedBy: string;
  latitude: number;
  longitude: number;
  createdAt: number;
};

export type PhotoShotType =
  | 'entrance'
  | 'crowd'
  | 'sky'
  | 'street'
  | 'parking'
  | 'beach'
  | 'inside'
  | 'custom';

export type VerifiedPlacePhoto = {
  id: string;
  requestId?: string;
  placeId: string;
  uri: string;
  shotType: PhotoShotType;
  helperId: string;
  capturedAt: number;
  serverCreatedAt: number;
  latitude: number;
  longitude: number;
  locationVerified: boolean;
};

export type PhotoRequestJob = {
  id: string;
  requesterId: string;
  placeId: string;
  placeName: string;
  latitude: number;
  longitude: number;
  requestedShots: PhotoShotType[];
  price: number;
  status: 'open' | 'accepted' | 'capturing' | 'submitted' | 'completed' | 'cancelled' | 'disputed';
  helperId?: string;
  createdAt: number;
  acceptedAt?: number;
  completedAt?: number;
};

export type RealityScore = {
  placeId: string;
  overallScore: number;
  photoRealityScore: number;
  crowdScore: number;
  priceFairnessScore: number;
  touristSafetyScore: number;
  localConfidenceScore: number;
  realityGap: 'low' | 'medium' | 'high';
  sampleSize: number;
  calculatedAt: number;
};

export type LocalHelperJobType = 'live_preview' | 'photo_request' | 'quick_question' | 'price_check' | 'place_status';
export type LocalHelperJobStatus =
  | 'open'
  | 'accepted'
  | 'in_progress'
  | 'submitted'
  | 'completed'
  | 'cancelled'
  | 'disputed'
  | 'expired';

export type LocalHelperJob = {
  id: string;
  type: LocalHelperJobType;
  requesterId: string;
  helperId?: string;
  placeId?: string;
  latitude?: number;
  longitude?: number;
  grossAmount: number;
  helperAmount: number;
  platformFee: number;
  status: LocalHelperJobStatus;
  createdAt: number;
};

export type HelperReputation = {
  userId: string;
  totalJobs: number;
  completedJobs: number;
  cancelledJobs: number;
  disputedJobs: number;
  validStatusReports: number;
  verifiedPhotos: number;
  averageResponseTimeSeconds: number;
  reputationScore: number;
  level: 'new' | 'local' | 'trusted' | 'expert';
  updatedAt: number;
};

export type PriceReport = {
  id: string;
  itemName: string;
  normalizedItemName: string;
  price: number;
  currency: string;
  placeId?: string;
  latitude?: number;
  longitude?: number;
  submittedBy: string;
  createdAt: number;
  verified: boolean;
};

export type ScamCategory =
  | 'taxi_overcharging'
  | 'fake_ticket'
  | 'tourist_price'
  | 'phone_snatching'
  | 'fake_tour'
  | 'payment_problem'
  | 'aggressive_seller'
  | 'other';

export type ScamReport = {
  id: string;
  category: ScamCategory;
  reporterId: string;
  placeId?: string;
  latitude: number;
  longitude: number;
  description?: string;
  createdAt: number;
  verificationCount: number;
  status: 'active' | 'expired' | 'removed';
};

export type TravelDecisionContext = {
  userLocation?: GeoPoint;
  destination: { id: string; name: string; lat: number; lng: number };
  distanceMeters?: number;
  estimatedTravelMinutes?: number;
  realityStatus?: PlaceRealityStatus;
  realityScore?: RealityScore;
  recentScamReports: ScamReport[];
  recentPriceReports: PriceReport[];
  recentPhotos: VerifiedPlacePhoto[];
};

export type TravelDecision = {
  verdict: 'go_now' | 'wait' | 'avoid' | 'insufficient_data';
  title: string;
  reasons: string[];
  recommendation?: string;
  confidence: number;
};

export const transportationModes = [
  'WALKING',
  'MOTORBIKE',
  'CAR',
  'BUS',
  'TRAIN',
  'AIRPLANE',
  'BICYCLE',
  'OTHER',
] as const;

export type TransportationMode = (typeof transportationModes)[number];

export type LiveTeamLocation = {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  speed: number | null;
  heading: number | null;
  altitude: number | null;
  timestamp: number;
};

export type LiveTeamRoutePoint = { latitude: number; longitude: number };

export type LiveTeamPlace = LiveTeamRoutePoint & { label: string };

export type LiveTeamRoute = {
  origin: LiveTeamPlace;
  destination: LiveTeamPlace;
  stops?: LiveTeamPlace[];
  path: LiveTeamRoutePoint[];
  distanceMeters: number;
  durationSeconds: number;
};

export type LiveTeamNavigationState = {
  active: boolean;
  targetIndex?: number;
  startedByUserId: string;
  startedByName: string;
  startedAt: number;
  updatedAt: number;
};

export type LiveTeamMember = {
  userId: string;
  name: string;
  transportationMode: TransportationMode;
  isOnline: boolean;
  isSpeaking: boolean;
  isMuted: boolean;
  locationSharing: boolean;
  location: LiveTeamLocation | null;
};

export type LiveTeamEvent =
  | { event: 'LOCATION_UPDATE'; userId: string; data: LiveTeamLocation & { name: string; transportationMode: TransportationMode } }
  | { event: 'LOCATION_SHARING_DISABLED'; userId: string }
  | { event: 'LOCATION_SHARING_ENABLED'; userId: string }
  | { event: 'TRANSPORTATION_CHANGED'; userId: string; data: { transportationMode: TransportationMode } }
  | { event: 'ROUTE_UPDATE'; userId: string; data: LiveTeamRoute }
  | { event: 'NAVIGATION_UPDATE'; userId: string; data: LiveTeamNavigationState };

export const transportationLabels: Record<TransportationMode, { icon: string; vi: string }> = {
  WALKING: { icon: '🚶', vi: 'Đi bộ' },
  MOTORBIKE: { icon: '🏍️', vi: 'Xe máy' },
  CAR: { icon: '🚗', vi: 'Ô tô' },
  BUS: { icon: '🚌', vi: 'Xe buýt' },
  TRAIN: { icon: '🚆', vi: 'Tàu hỏa' },
  AIRPLANE: { icon: '✈️', vi: 'Máy bay' },
  BICYCLE: { icon: '🚲', vi: 'Xe đạp' },
  OTHER: { icon: '📍', vi: 'Khác' },
};

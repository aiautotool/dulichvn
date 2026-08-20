import { Track, type Participant } from 'livekit-client';
import { transportationModes, type LiveTeamEvent, type LiveTeamLocation, type LiveTeamMember, type LiveTeamRoute, type LiveTeamRoutePoint, type TransportationMode } from '../types';

const encoder = new TextEncoder();
const decoder = new TextDecoder();
const MAX_LIVEKIT_DATA_BYTES = 60_000;
const MAX_REALTIME_ROUTE_POINTS = 500;

export function encodeLiveTeamEvent(event: LiveTeamEvent) {
  const compactEvent = compactLiveTeamEvent(event);
  const encoded = encoder.encode(JSON.stringify(compactEvent));
  if (encoded.byteLength <= MAX_LIVEKIT_DATA_BYTES || event.event !== 'ROUTE_UPDATE') return encoded;

  const fallbackEvent: LiveTeamEvent = {
    ...event,
    data: compactRoute(event.data, 120),
  };
  const fallbackEncoded = encoder.encode(JSON.stringify(fallbackEvent));
  if (fallbackEncoded.byteLength <= MAX_LIVEKIT_DATA_BYTES) return fallbackEncoded;

  return encoder.encode(JSON.stringify({
    ...event,
    data: compactRoute(event.data, 2),
  }));
}

export function decodeLiveTeamEvent(payload: Uint8Array): LiveTeamEvent | null {
  try {
    const value = JSON.parse(decoder.decode(payload)) as LiveTeamEvent;
    return value && typeof value === 'object' && 'event' in value ? value : null;
  } catch {
    return null;
  }
}

export function memberFromParticipant(
  participant: Participant,
  previous: LiveTeamMember | undefined,
  fallbackMode: TransportationMode = 'OTHER',
): LiveTeamMember {
  const microphone = participant.getTrackPublication(Track.Source.Microphone);
  return {
    userId: participant.identity,
    name: participant.name || previous?.name || 'Thành viên',
    transportationMode: previous?.transportationMode ?? fallbackMode,
    isOnline: true,
    isSpeaking: participant.isSpeaking,
    isMuted: microphone ? microphone.isMuted : true,
    locationSharing: previous?.locationSharing ?? false,
    location: previous?.location ?? null,
  };
}

export function applyLiveTeamEvent(
  members: Record<string, LiveTeamMember>,
  event: LiveTeamEvent,
): Record<string, LiveTeamMember> {
  const current = members[event.userId];
  if (event.event === 'LOCATION_UPDATE') {
    const mode = validMode(event.data.transportationMode) ? event.data.transportationMode : 'OTHER';
    return {
      ...members,
      [event.userId]: {
        userId: event.userId,
        name: event.data.name || current?.name || 'Thành viên',
        transportationMode: mode,
        isOnline: current?.isOnline ?? true,
        isSpeaking: current?.isSpeaking ?? false,
        isMuted: current?.isMuted ?? false,
        locationSharing: true,
        location: sanitizeLocation(event.data),
      },
    };
  }
  if (!current) return members;
  if (event.event === 'LOCATION_SHARING_DISABLED') {
    return { ...members, [event.userId]: { ...current, locationSharing: false } };
  }
  if (event.event === 'LOCATION_SHARING_ENABLED') {
    return { ...members, [event.userId]: { ...current, locationSharing: true } };
  }
  if (event.event === 'TRANSPORTATION_CHANGED' && validMode(event.data.transportationMode)) {
    return { ...members, [event.userId]: { ...current, transportationMode: event.data.transportationMode } };
  }
  return members;
}

function compactLiveTeamEvent(event: LiveTeamEvent): LiveTeamEvent {
  if (event.event !== 'ROUTE_UPDATE') return event;
  return { ...event, data: compactRoute(event.data) };
}

function compactRoute(route: LiveTeamRoute, maxPoints = MAX_REALTIME_ROUTE_POINTS): LiveTeamRoute {
  return {
    ...route,
    origin: { ...route.origin, latitude: roundCoordinate(route.origin.latitude), longitude: roundCoordinate(route.origin.longitude) },
    destination: { ...route.destination, latitude: roundCoordinate(route.destination.latitude), longitude: roundCoordinate(route.destination.longitude) },
    stops: route.stops?.map((stop) => ({ ...stop, latitude: roundCoordinate(stop.latitude), longitude: roundCoordinate(stop.longitude) })),
    path: sampleRoutePath(route.path, maxPoints).map((point) => ({
      latitude: roundCoordinate(point.latitude),
      longitude: roundCoordinate(point.longitude),
    })),
  };
}

function sampleRoutePath(path: LiveTeamRoutePoint[], maxPoints: number) {
  if (path.length <= maxPoints) return path;
  const sampled: LiveTeamRoutePoint[] = [];
  const lastIndex = path.length - 1;
  for (let index = 0; index < maxPoints; index += 1) {
    sampled.push(path[Math.round(index * lastIndex / (maxPoints - 1))]);
  }
  return sampled;
}

function roundCoordinate(value: number) {
  return Math.round(value * 100000) / 100000;
}

function validMode(value: string): value is TransportationMode {
  return transportationModes.includes(value as TransportationMode);
}

function sanitizeLocation(value: LiveTeamLocation): LiveTeamLocation {
  return {
    latitude: Number(value.latitude),
    longitude: Number(value.longitude),
    accuracy: finiteOrNull(value.accuracy),
    speed: finiteOrNull(value.speed),
    heading: finiteOrNull(value.heading),
    altitude: finiteOrNull(value.altitude),
    timestamp: Number.isFinite(value.timestamp) ? value.timestamp : Date.now(),
  };
}

function finiteOrNull(value: number | null) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

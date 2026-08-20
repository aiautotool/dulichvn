import type { LiveTeamPlace, LiveTeamRoute, TransportationMode } from '../types';

const apiBaseUrl = (process.env.EXPO_PUBLIC_VINAGO_API_BASE_URL?.trim() || process.env.EXPO_PUBLIC_API_BASE_URL?.trim() || 'https://vinago.aiautotool.com').replace(/\/$/, '');

export async function searchLiveTeamPlaces(query: string, signal?: AbortSignal): Promise<LiveTeamPlace[]> {
  const response = await fetch(`${apiBaseUrl}/api/maps/search?q=${encodeURIComponent(query.trim())}`, { signal });
  const payload = await response.json() as { places?: LiveTeamPlace[]; error?: string };
  if (!response.ok) throw new Error(payload.error || 'Không thể tìm địa điểm.');
  return payload.places ?? [];
}

export async function calculateLiveTeamRoute(places: LiveTeamPlace[], transportationMode: TransportationMode, signal?: AbortSignal): Promise<LiveTeamRoute> {
  const response = await fetch(`${apiBaseUrl}/api/maps/route?v=2`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ places, transportationMode }),
    signal,
  });
  const payload = await response.json() as { route?: LiveTeamRoute; error?: string };
  if (!response.ok || !payload.route) throw new Error(payload.error || 'Không thể vẽ tuyến đường.');
  return payload.route;
}

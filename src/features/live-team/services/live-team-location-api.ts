import { getLiveCallAuthHeaders } from '../../live-preview/services/liveCallAuth';
import type { LiveTeamLocation, TransportationMode } from '../types';

const apiBaseUrl = (process.env.EXPO_PUBLIC_VINAGO_API_BASE_URL?.trim() || process.env.EXPO_PUBLIC_API_BASE_URL?.trim() || 'https://vinago.aiautotool.com').replace(/\/$/, '');

export type LiveTeamLocationSnapshot = { userId: string; name: string; transportationMode: TransportationMode; location: LiveTeamLocation; updatedAt: number };

export async function publishLiveTeamLocation(roomCode: string, name: string, transportationMode: TransportationMode, location: LiveTeamLocation) {
  const response = await fetch(`${apiBaseUrl}/api/live-teams/location`, { method: 'POST', headers: { ...await getLiveCallAuthHeaders(), 'Content-Type': 'application/json' }, body: JSON.stringify({ roomCode, name, transportationMode, location }) });
  if (!response.ok) throw new Error('Không thể đồng bộ vị trí nền.');
}

export async function getLiveTeamLocationSnapshots(roomCode: string): Promise<LiveTeamLocationSnapshot[]> {
  const response = await fetch(`${apiBaseUrl}/api/live-teams/location?roomCode=${encodeURIComponent(roomCode)}`, { headers: await getLiveCallAuthHeaders() });
  const payload = await response.json().catch(() => ({})) as { locations?: LiveTeamLocationSnapshot[]; error?: string };
  if (!response.ok) throw new Error(payload.error || 'Không thể tải vị trí thành viên Live Team.');
  return payload.locations ?? [];
}

export async function removeLiveTeamLocation(roomCode: string) {
  await fetch(`${apiBaseUrl}/api/live-teams/location?roomCode=${encodeURIComponent(roomCode)}`, { method: 'DELETE', headers: await getLiveCallAuthHeaders() });
}

import type { LivePreviewActorRole } from '../types';
import { getLiveCallAuthHeaders } from './liveCallAuth';

export type LiveCallCredentials = {
  serverUrl: string;
  token: string;
  roomName: string;
  expiresInSeconds: number;
};

const apiBaseUrl = (
  process.env.EXPO_PUBLIC_VINAGO_API_BASE_URL?.trim() ||
  process.env.EXPO_PUBLIC_API_BASE_URL?.trim() ||
  'https://vinago.aiautotool.com'
).replace(/\/$/, '');

export async function getLiveCallCredentials(
  requestId: string,
  role: LivePreviewActorRole,
): Promise<LiveCallCredentials> {
  const authHeaders = await getLiveCallAuthHeaders();

  const response = await fetch(`${apiBaseUrl}/api/live-preview/calls/token`, {
    method: 'POST',
    headers: {
      ...authHeaders,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ requestId, role }),
  });

  const payload = await response.json() as Partial<LiveCallCredentials> & { error?: string };
  if (!response.ok) {
    throw new Error(payload.error || 'Could not authorize this video call.');
  }
  if (!payload.serverUrl || !payload.token || !payload.roomName) {
    throw new Error('The video call server returned incomplete credentials.');
  }

  return {
    serverUrl: payload.serverUrl,
    token: payload.token,
    roomName: payload.roomName,
    expiresInSeconds: payload.expiresInSeconds ?? 900,
  };
}

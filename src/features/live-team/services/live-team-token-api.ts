import { getLiveCallAuthHeaders } from '../../live-preview/services/liveCallAuth';

export type LiveTeamCredentials = {
  serverUrl: string;
  token: string;
  roomName: string;
  expiresInSeconds: number;
};

const apiBaseUrl = (
  process.env.EXPO_PUBLIC_VINAGO_API_BASE_URL?.trim()
  || process.env.EXPO_PUBLIC_API_BASE_URL?.trim()
  || 'https://vinago.aiautotool.com'
).replace(/\/$/, '');

export async function getLiveTeamCredentials(roomCode: string): Promise<LiveTeamCredentials> {
  const response = await fetch(`${apiBaseUrl}/api/live-teams/token`, {
    method: 'POST',
    headers: { ...await getLiveCallAuthHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ roomCode }),
  });
  const payload = await response.json() as Partial<LiveTeamCredentials> & { error?: string };
  if (!response.ok) throw new Error(payload.error || 'Không thể tham gia Live Team.');
  if (!payload.serverUrl || !payload.token || !payload.roomName) throw new Error('Máy chủ trả về thông tin chưa đầy đủ.');
  return {
    serverUrl: payload.serverUrl,
    token: payload.token,
    roomName: payload.roomName,
    expiresInSeconds: payload.expiresInSeconds ?? 3600,
  };
}

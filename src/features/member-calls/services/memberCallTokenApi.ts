import { getLiveCallAuthHeaders } from '../../live-preview/services/liveCallAuth';

export type MemberCallCredentials = {
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

export async function getMemberCallCredentials(roomCode: string): Promise<MemberCallCredentials> {
  const authHeaders = await getLiveCallAuthHeaders();
  const response = await fetch(`${apiBaseUrl}/api/member-calls/token`, {
    method: 'POST',
    headers: {
      ...authHeaders,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ roomCode }),
  });

  const payload = await response.json() as Partial<MemberCallCredentials> & { error?: string };
  if (!response.ok) {
    throw new Error(payload.error || 'Không thể tham gia phòng gọi video.');
  }
  if (!payload.serverUrl || !payload.token || !payload.roomName) {
    throw new Error('Máy chủ gọi video trả về thông tin chưa đầy đủ.');
  }

  return {
    serverUrl: payload.serverUrl,
    token: payload.token,
    roomName: payload.roomName,
    expiresInSeconds: payload.expiresInSeconds ?? 3600,
  };
}

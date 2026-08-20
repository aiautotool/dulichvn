import { getLiveCallAuthHeaders } from '../../live-preview/services/liveCallAuth';
import { getGuestAuthHeaders } from '../../account/services/guest-session';

export type MemberSocialProfile = {
  id: string;
  name: string;
  email: string;
  lastSeenAt: number;
  distanceKm?: number;
};

export type MemberSocialOverview = {
  friends: MemberSocialProfile[];
  incomingRequests: MemberSocialProfile[];
  outgoingRequests: MemberSocialProfile[];
  searchResults: MemberSocialProfile[];
  incomingCall: { caller: MemberSocialProfile; roomCode: string; expiresAt: number; mode: 'audio' | 'video' } | null;
  nearbyMembers: MemberSocialProfile[];
  latestIncomingMessage: { id: string; text: string; createdAt: number; sender: MemberSocialProfile } | null;
  incomingLiveTeamInvite?: { inviter: MemberSocialProfile; roomCode: string; teamName: string; expiresAt: number } | null;
};

export type MemberChatMessage = {
  id: string;
  senderId: string;
  recipientId: string;
  text: string;
  attachment?: MemberChatAttachment;
  createdAt: number;
};

export type MemberChatAttachment = {
  kind: 'image' | 'video' | 'document' | 'audio';
  url: string;
  name: string;
  mimeType: string;
  size: number;
  durationMs?: number;
};

export type MemberChatUpload = {
  uri: string;
  name: string;
  mimeType: string;
  kind: MemberChatAttachment['kind'];
  durationMs?: number;
  webFile?: Blob;
};

const EMPTY_OVERVIEW: MemberSocialOverview = {
  friends: [],
  incomingRequests: [],
  outgoingRequests: [],
  searchResults: [],
  incomingCall: null,
  nearbyMembers: [],
  latestIncomingMessage: null,
  incomingLiveTeamInvite: null,
};

const apiBaseUrl = (
  process.env.EXPO_PUBLIC_VINAGO_API_BASE_URL?.trim() ||
  process.env.EXPO_PUBLIC_API_BASE_URL?.trim() ||
  'https://vinago.aiautotool.com'
).replace(/\/$/, '');

export async function getMemberSocialOverview(query = '', coordinates?: { lat: number; lng: number } | null): Promise<MemberSocialOverview> {
  const locationQuery = coordinates ? `&lat=${encodeURIComponent(coordinates.lat)}&lng=${encodeURIComponent(coordinates.lng)}` : '';
  const payload = await authenticatedRequest(`/api/member-social?query=${encodeURIComponent(query)}${locationQuery}`);
  return {
    friends: payload.friends ?? [],
    incomingRequests: payload.incomingRequests ?? [],
    outgoingRequests: payload.outgoingRequests ?? [],
    searchResults: payload.searchResults ?? [],
    incomingCall: payload.incomingCall ?? null,
    nearbyMembers: payload.nearbyMembers ?? [],
    latestIncomingMessage: payload.latestIncomingMessage ?? null,
    incomingLiveTeamInvite: payload.incomingLiveTeamInvite ?? null,
  };
}

export async function getNearbyLiveTeamMembers(coordinates: { lat: number; lng: number }) {
  const payload = await authenticatedRequest<Partial<MemberSocialOverview>>(`/api/member-social?nearby=live-team&lat=${encodeURIComponent(coordinates.lat)}&lng=${encodeURIComponent(coordinates.lng)}`);
  return payload.nearbyMembers ?? [];
}

export async function inviteMemberToLiveTeam(targetMemberId: string, roomCode: string, teamName: string, coordinates?: { lat: number; lng: number } | null) {
  await authenticatedRequest('/api/member-social/live-team/invite', { method: 'POST', body: JSON.stringify({ targetMemberId, roomCode, teamName, ...(coordinates ? coordinates : {}) }) });
}

export async function respondToLiveTeamInvite(accept: boolean) {
  await authenticatedRequest('/api/member-social/live-team/respond', { method: 'POST', body: JSON.stringify({ accept }) });
}

export async function inviteMemberFriendCall(targetMemberId: string, roomCode: string, callMode: 'audio' | 'video') {
  await authenticatedRequest('/api/member-social/calls/invite', {
    method: 'POST',
    body: JSON.stringify({ targetMemberId, roomCode, callMode }),
  });
}

export async function registerMemberPushToken(pushToken: string) {
  await authenticatedRequest('/api/member-social/push-token', {
    method: 'POST',
    body: JSON.stringify({ pushToken }),
  });
}

export async function getMemberChatMessages(friendId: string) {
  const payload = await authenticatedRequest<{ messages?: MemberChatMessage[] }>(`/api/member-social/chats/${encodeURIComponent(friendId)}/messages`);
  return payload.messages ?? [];
}

export async function sendMemberChatMessage(friendId: string, text: string) {
  const payload = await authenticatedRequest<{ message?: MemberChatMessage }>(`/api/member-social/chats/${encodeURIComponent(friendId)}/messages`, {
    method: 'POST',
    body: JSON.stringify({ text }),
  });
  if (!payload.message) throw new Error('Máy chủ không trả về tin nhắn vừa gửi.');
  return payload.message;
}

export async function deleteMemberChatMessage(friendId: string, messageId: string) {
  await authenticatedRequest(`/api/member-social/chats/${encodeURIComponent(friendId)}/messages`, {
    method: 'DELETE',
    body: JSON.stringify({ messageId }),
  });
}

export async function getMemberBlockStatus(friendId: string) {
  return authenticatedRequest<{ blockedByMe: boolean; blockedByThem: boolean }>(`/api/member-social/blocks/${encodeURIComponent(friendId)}`);
}

export async function setMemberBlocked(friendId: string, blocked: boolean) {
  return authenticatedRequest<{ blockedByMe: boolean; blockedByThem: boolean }>(`/api/member-social/blocks/${encodeURIComponent(friendId)}`, {
    method: 'POST',
    body: JSON.stringify({ blocked }),
  });
}

export function resolveMemberChatMediaUrl(url: string) {
  return url.startsWith('/') ? `${apiBaseUrl}${url}` : url;
}

export async function respondToMemberCallInvite(accept: boolean) {
  await authenticatedRequest('/api/member-social/calls/respond', {
    method: 'POST',
    body: JSON.stringify({ accept }),
  });
}

export async function sendMemberFriendRequest(target: Pick<MemberSocialProfile, 'id' | 'email'>) {
  await authenticatedRequest('/api/member-social/friends/request', {
    method: 'POST',
    body: JSON.stringify({ targetMemberId: target.id, targetEmail: target.email }),
  });
}

export async function respondToMemberFriendRequest(requesterId: string, accept: boolean) {
  await authenticatedRequest('/api/member-social/friends/respond', {
    method: 'POST',
    body: JSON.stringify({ requesterId, accept }),
  });
}

async function authenticatedRequest<T = Partial<MemberSocialOverview>>(path: string, options: RequestInit = {}): Promise<T> {
  const authHeaders = await getLiveCallAuthHeaders();
  let response: Response;
  try {
    response = await sendAuthenticatedRequest(path, options, authHeaders);
    if (response.status === 401) {
      response = await sendAuthenticatedRequest(path, options, await getGuestAuthHeaders());
    }
  } catch {
    throw new Error('Không thể kết nối máy chủ. Hãy kiểm tra Internet và thử lại.');
  }
  const payload = await response.json().catch(() => EMPTY_OVERVIEW) as T & { error?: string };
  if (!response.ok) throw new Error(payload.error || 'Không thể cập nhật danh sách bạn bè.');
  return payload as T;
}

function sendAuthenticatedRequest(path: string, options: RequestInit, authHeaders: Record<string, string>) {
  return fetch(`${apiBaseUrl}${path}`, {
    ...options,
    headers: {
      ...authHeaders,
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  });
}

import 'expo-sqlite/localStorage/install';

export type GuestSession = {
  sessionToken: string;
  expiresAt: string;
  user: {
    id: string;
    email: string;
    name: string;
    verifiedEmail: false;
  };
};

const STORAGE_KEY = 'vinago-plus-guest-session-v1';
const apiBaseUrl = (
  process.env.EXPO_PUBLIC_VINAGO_API_BASE_URL?.trim()
  || process.env.EXPO_PUBLIC_API_BASE_URL?.trim()
  || 'https://vinago.aiautotool.com'
).replace(/\/$/, '');

let pendingSession: Promise<GuestSession> | null = null;
let verifiedSessionToken: string | null = null;

export function getStoredGuestSession(): GuestSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw) as GuestSession;
    if (!isValidGuestSession(session)) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

export async function getOrCreateGuestSession(): Promise<GuestSession> {
  const stored = getStoredGuestSession();
  if (stored?.sessionToken === verifiedSessionToken) return stored;
  if (pendingSession) return pendingSession;

  pendingSession = (async () => {
    if (stored && await verifyGuestSession(stored)) {
      verifiedSessionToken = stored.sessionToken;
      return stored;
    }

    if (stored) localStorage.removeItem(STORAGE_KEY);
    const session = await createGuestSession();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    verifiedSessionToken = session.sessionToken;
    return session;
  })().finally(() => {
    pendingSession = null;
  });

  return pendingSession;
}

export async function getGuestAuthHeaders(): Promise<Record<string, string>> {
  const session = await getOrCreateGuestSession();
  return { Authorization: `Bearer ${session.sessionToken}` };
}

function isValidGuestSession(value: GuestSession | null | undefined): value is GuestSession {
  return Boolean(
    value
    && /^[a-f0-9]{72}$/i.test(value.sessionToken)
    && /^guest_[a-f0-9]{20}$/i.test(value.user?.id)
    && typeof value.user?.name === 'string'
    && Date.parse(value.expiresAt) > Date.now() + 60_000,
  );
}

async function verifyGuestSession(session: GuestSession): Promise<boolean> {
  try {
    const response = await fetch(`${apiBaseUrl}/api/auth/session/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionToken: session.sessionToken }),
    });
    if (!response.ok) return false;
    const payload = await response.json() as { data?: { user?: GuestSession['user'] } };
    return payload.data?.user?.id === session.user.id;
  } catch {
    throw new Error('Không thể xác minh chế độ Guest. Hãy kiểm tra Internet và thử lại.');
  }
}

async function createGuestSession(): Promise<GuestSession> {
  let response: Response;
  try {
    response = await fetch(`${apiBaseUrl}/api/auth/guest/session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Guest traveler' }),
    });
  } catch {
    throw new Error('Không thể kết nối máy chủ để khởi tạo chế độ Guest.');
  }
  const payload = await response.json().catch(() => ({})) as { data?: GuestSession; error?: string };
  if (!response.ok || !payload.data || !isValidGuestSession(payload.data)) {
    throw new Error(payload.error || 'Không thể khởi tạo chế độ Guest.');
  }
  return payload.data;
}

import { Platform } from 'react-native';

const DEFAULT_NATIVE_API_BASE_URL = 'https://vinago.aiautotool.com';
const APP_SCHEME = 'vinagoplus';

export type QrLoginUser = {
  id: string;
  email: string;
  name: string;
  givenName?: string;
  picture?: string;
  verifiedEmail: boolean;
};

export type QrLoginSession = {
  sessionId: string;
  pollToken: string;
  qrData: string;
  status: 'pending' | 'approved';
  expiresAt: string;
};

export type QrLoginPollResult =
  | {
      status: 'pending' | 'expired';
      expiresAt?: string;
    }
  | {
      status: 'approved';
      expiresAt: string;
      user: QrLoginUser;
      sessionToken: string;
      webSessionExpiresAt: string;
    };

export type ParsedQrLoginPayload = {
  apiBaseUrl: string;
  sessionId: string;
  approvalToken: string;
};

type ApiResponse<T> =
  | {
      ok: true;
      data: T;
    }
  | {
      ok?: false;
      error?: string;
      detail?: string;
    };

function configuredApiBaseUrl() {
  const configured =
    process.env.EXPO_PUBLIC_VINAGO_API_BASE_URL?.trim() ||
    process.env.EXPO_PUBLIC_API_BASE_URL?.trim();
  if (configured) return configured.replace(/\/+$/, '');

  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return window.location.origin.replace(/\/+$/, '');
  }

  return DEFAULT_NATIVE_API_BASE_URL;
}

function apiUrl(path: string) {
  return `${configuredApiBaseUrl()}${path}`;
}

async function fetchApi<T>(url: string, init: RequestInit) {
  const response = await fetch(url, {
    ...init,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  });
  const json = (await response.json().catch(() => null)) as ApiResponse<T> | null;

  if (!response.ok || json?.ok === false) {
    const message =
      json && 'error' in json
        ? json.error || json.detail
        : `HTTP ${response.status}`;
    throw new Error(message || 'QR login request failed.');
  }

  return (json && 'data' in json ? json.data : json) as T;
}

export async function createQrLoginSession() {
  return fetchApi<QrLoginSession>(apiUrl('/api/auth/qr/session'), {
    body: JSON.stringify({
      clientOrigin:
        Platform.OS === 'web' && typeof window !== 'undefined'
          ? window.location.origin
          : undefined,
    }),
    method: 'POST',
  });
}

export async function pollQrLoginSession(sessionId: string, pollToken: string) {
  const url = new URL(apiUrl(`/api/auth/qr/session/${sessionId}`));
  url.searchParams.set('pollToken', pollToken);
  return fetchApi<QrLoginPollResult>(url.toString(), {
    method: 'GET',
  });
}

export async function approveQrLoginSession(
  payload: ParsedQrLoginPayload,
  accountIdToken: string,
) {
  return fetchApi<{ status: 'approved'; user: QrLoginUser }>(
    `${payload.apiBaseUrl}/api/auth/qr/approve`,
    {
      body: JSON.stringify({
        approvalToken: payload.approvalToken,
        sessionId: payload.sessionId,
      }),
      headers: {
        Authorization: `Bearer ${accountIdToken}`,
      },
      method: 'POST',
    },
  );
}

export async function verifyQrWebSession(sessionToken: string) {
  return fetchApi<{ user: QrLoginUser; expiresAt: string }>(
    apiUrl('/api/auth/session/verify'),
    {
      body: JSON.stringify({ sessionToken }),
      method: 'POST',
    },
  );
}

export function parseQrLoginPayload(raw: string): ParsedQrLoginPayload {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error('Invalid QR login code.');
  }

  if (url.protocol !== `${APP_SCHEME}:` || url.hostname !== 'auth' || url.pathname !== '/qr') {
    throw new Error('This is not a Vinago+ web login QR code.');
  }

  const apiBaseUrl = url.searchParams.get('api')?.replace(/\/+$/, '') ?? '';
  const sessionId = url.searchParams.get('sessionId') ?? '';
  const approvalToken = url.searchParams.get('approvalToken') ?? '';

  if (!isAllowedApiBaseUrl(apiBaseUrl)) {
    throw new Error('The QR login API is not allowed.');
  }
  if (!/^[A-Za-z0-9_-]{16,128}$/.test(sessionId)) {
    throw new Error('The QR login session is invalid.');
  }
  if (!/^[A-Za-z0-9_-]{16,128}$/.test(approvalToken)) {
    throw new Error('The QR login approval token is invalid.');
  }

  return {
    apiBaseUrl,
    approvalToken,
    sessionId,
  };
}

function isAllowedApiBaseUrl(raw: string) {
  try {
    const url = new URL(raw);
    if (url.protocol === 'https:') return true;
    if (url.protocol !== 'http:') return false;

    const host = url.hostname.toLowerCase();
    if (host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0') return true;
    if (/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host)) return true;
    if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(host)) return true;

    const private172 = host.match(/^172\.(\d{1,2})\.\d{1,3}\.\d{1,3}$/);
    return Boolean(private172 && Number(private172[1]) >= 16 && Number(private172[1]) <= 31);
  } catch {
    return false;
  }
}

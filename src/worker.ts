import { DurableObject } from 'cloudflare:workers';
import { privacyPolicyResponse } from './privacyPolicy';
import { MockLiveCallRepository } from './features/live-preview/repositories/MockLiveCallRepository';
import { MockLivePreviewRepository } from './features/live-preview/repositories/MockLivePreviewRepository';
import { MockPaymentEscrowRepository } from './features/live-preview/repositories/MockPaymentEscrowRepository';
import { LiveCallService } from './features/live-preview/services/LiveCallService';
import { LivePreviewService } from './features/live-preview/services/LivePreviewService';
import { PaymentEscrowService } from './features/live-preview/services/PaymentEscrowService';
import { type LivePreviewActor, type LivePreviewActorRole } from './features/live-preview/types';
import { MockLocalHelperRepository } from './features/local-helper/repositories/MockLocalHelperRepository';
import { LocalHelperService } from './features/local-helper/services/LocalHelperService';

interface Env {
  ASSETS: Fetcher;
  QR_AUTH_STORE?: DurableObjectNamespace;
  RESEND_API_KEY?: string;
  ITINERARY_EMAIL_FROM?: string;
}

type ItineraryEmailRequest = {
  to?: string;
  name?: string;
  itinerary?: {
    title?: string;
    body?: string;
    city?: string;
    days?: number;
    style?: string;
    createdAt?: string;
  };
  profile?: {
    language?: string;
    purpose?: string;
    currentCity?: string;
    tripDays?: number;
  };
};

type WorkerUser = {
  id: string;
  name: string;
  email: string;
};

type QrLoginUser = {
  id: string;
  email: string;
  name: string;
  givenName?: string;
  picture?: string;
  verifiedEmail: boolean;
};

type QrLoginRecord = {
  sessionId: string;
  pollToken: string;
  approvalToken: string;
  clientOrigin?: string;
  expiresAt: number;
  status: 'pending' | 'approved';
  approvedUser?: QrLoginUser;
  webSessionToken?: string;
  webSessionExpiresAt?: number;
};

type QrWebSessionRecord = {
  token: string;
  user: QrLoginUser;
  expiresAt: number;
};

const APP_SCHEME = 'vinagoplus';
const QR_LOGIN_TTL_MS = 5 * 60 * 1000;
const QR_WEB_SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const QR_AUTH_OBJECT_NAME = 'vinago-qr-auth-v1';
const QR_LOGIN_STORAGE_PREFIX = 'qr-login:';
const QR_WEB_SESSION_STORAGE_PREFIX = 'qr-web-session:';
const qrLoginSessions = new Map<string, QrLoginRecord>();
const qrWebSessions = new Map<string, QrWebSessionRecord>();

const livePreviewRepository = new MockLivePreviewRepository();
const liveCallRepository = new MockLiveCallRepository();
const paymentEscrowRepository = new MockPaymentEscrowRepository();
const localHelperRepository = new MockLocalHelperRepository(livePreviewRepository);
const liveCallService = new LiveCallService(liveCallRepository);
const paymentEscrowService = new PaymentEscrowService(livePreviewRepository, paymentEscrowRepository);
const livePreviewService = new LivePreviewService(
  livePreviewRepository,
  localHelperRepository,
  paymentEscrowService,
  liveCallService,
);
const localHelperService = new LocalHelperService(localHelperRepository, livePreviewService);

export default {
  async fetch(request, env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS' && url.pathname.startsWith('/api/')) {
      return new Response(null, { headers: corsHeaders(request) });
    }

    if (url.pathname === '/api/itinerary-email') {
      return handleItineraryEmail(request, env);
    }

    if (url.pathname.startsWith('/api/auth/qr/') || url.pathname === '/api/auth/session/verify') {
      if (env.QR_AUTH_STORE) {
        const stub = env.QR_AUTH_STORE.get(env.QR_AUTH_STORE.idFromName(QR_AUTH_OBJECT_NAME));
        return stub.fetch(request);
      }
      return handleQrAuthApi(request);
    }

    if (url.pathname.startsWith('/api/live-preview/') || url.pathname.startsWith('/api/local-helper/')) {
      return handleLivePreviewApi(request);
    }

    if (url.pathname.startsWith('/api/admin/live-preview/')) {
      return handleLivePreviewAdminApi(request);
    }

    if (url.pathname === '/privacy-policy' || url.pathname === '/privacy-policy/') {
      return privacyPolicyResponse();
    }

    return assetResponse(request, env);
  },
} satisfies ExportedHandler<Env>;

export class QrAuthDurableObject extends DurableObject<Env> {
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
  }

  async fetch(request: Request): Promise<Response> {
    await this.ctx.storage.setAlarm(Date.now() + QR_LOGIN_TTL_MS);
    return handleQrAuthApi(request, this.ctx.storage);
  }

  async alarm(): Promise<void> {
    await cleanupQrAuthStorage(this.ctx.storage);
  }
}

async function handleLivePreviewApi(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const user = authenticateWorkerUser(request);
  if (!user) {
    return jsonResponse({ error: 'Missing authenticated user' }, 401, request);
  }

  try {
    if (url.pathname === '/api/live-preview/requests' && request.method === 'POST') {
      const body = await readJsonBody<{
        placeId?: string;
        placeName?: string;
        city?: string;
        lat?: number;
        lng?: number;
        requestedLanguage?: string;
        note?: string;
      }>(request);
      if (!body.placeId || !body.placeName || !body.city || typeof body.lat !== 'number' || typeof body.lng !== 'number') {
        return jsonResponse({ error: 'Missing place fields' }, 400, request);
      }

      const result = await livePreviewService.createRequest({
        placeId: body.placeId,
        placeName: body.placeName,
        city: body.city,
        lat: body.lat,
        lng: body.lng,
        travelerId: user.id,
        travelerName: user.name,
        requestedLanguage: body.requestedLanguage ?? 'English',
        note: body.note ?? '',
      });
      return jsonResponse({ request: result }, 201, request);
    }

    if (url.pathname === '/api/live-preview/helper/jobs' && request.method === 'GET') {
      const helperProfile = await localHelperService.getProfile(user.id);
      if (!helperProfile) {
        return jsonResponse({ jobs: [] }, 200, request);
      }
      const jobs = await localHelperService.listNearbyJobs(user.id);
      return jsonResponse({ jobs }, 200, request);
    }

    if (url.pathname === '/api/local-helper/profile' && request.method === 'GET') {
      const profile = await localHelperService.getProfile(user.id);
      return jsonResponse({ profile }, 200, request);
    }

    if (url.pathname === '/api/local-helper/profile' && request.method === 'POST') {
      const body = await readJsonBody<{
        fullName?: string;
        avatarUrl?: string;
        phone?: string;
        email?: string;
        city?: string;
        languages?: string[];
        intro?: string;
        payoutAccountLabel?: string;
      }>(request);
      const profile = await localHelperService.saveProfile({
        userId: user.id,
        fullName: body.fullName ?? user.name,
        avatarUrl: body.avatarUrl ?? '',
        phone: body.phone ?? '',
        email: body.email ?? user.email,
        city: body.city ?? 'Other',
        languages: body.languages ?? ['English'],
        intro: body.intro ?? 'Local helper on Vinago+',
        payoutAccountLabel: body.payoutAccountLabel ?? '',
      });
      return jsonResponse({ profile }, 200, request);
    }

    if (url.pathname === '/api/local-helper/online' && request.method === 'POST') {
      const body = await readJsonBody<{
        isOnline?: boolean;
        currentLat?: number | null;
        currentLng?: number | null;
      }>(request);
      const profile = await localHelperService.setOnline({
        userId: user.id,
        isOnline: body.isOnline === true,
        currentLat: body.currentLat ?? null,
        currentLng: body.currentLng ?? null,
      });
      return jsonResponse({ profile }, 200, request);
    }

    if (url.pathname === '/api/local-helper/earnings' && request.method === 'GET') {
      const earnings = await localHelperService.listEarnings(user.id);
      return jsonResponse({ earnings }, 200, request);
    }

    const requestRoute = url.pathname.match(/^\/api\/live-preview\/requests\/([^/]+)(?:\/([^/]+))?\/?$/);
    if (requestRoute) {
      const [, requestId, action] = requestRoute;

      if (!action && request.method === 'GET') {
        const result = await livePreviewService.getRequest(requestId);
        return result
          ? jsonResponse({ request: result }, 200, request)
          : jsonResponse({ error: 'Live preview request not found' }, 404, request);
      }

      if (action === 'pay' && request.method === 'POST') {
        const actor = actorFromUser(user, 'traveler');
        const result = await livePreviewService.payAndPublish(requestId, actor);
        return jsonResponse({ request: result }, 200, request);
      }

      if (action === 'accept' && request.method === 'POST') {
        const result = await livePreviewService.acceptRequest(requestId, actorFromUser(user, 'helper'));
        return jsonResponse({ request: result }, 200, request);
      }

      if (action === 'start-call' && request.method === 'POST') {
        const body = await readOptionalJsonBody<{ role?: LivePreviewActorRole }>(request);
        const existing = await livePreviewService.getRequest(requestId);
        if (!existing) return jsonResponse({ error: 'Live preview request not found' }, 404, request);
        const actor = actorForRequest(user, existing.travelerId, existing.helperId, body?.role);
        const result = await livePreviewService.startCall(requestId, actor);
        return jsonResponse({ request: result }, 200, request);
      }

      if (action === 'end-call' && request.method === 'POST') {
        const body = await readOptionalJsonBody<{ role?: LivePreviewActorRole; durationSeconds?: number }>(request);
        const existing = await livePreviewService.getRequest(requestId);
        if (!existing) return jsonResponse({ error: 'Live preview request not found' }, 404, request);
        const actor = actorForRequest(user, existing.travelerId, existing.helperId, body?.role);
        const result = await livePreviewService.endCall(requestId, actor, body?.durationSeconds ?? 0);
        return jsonResponse({ request: result }, 200, request);
      }

      if (action === 'confirm' && request.method === 'POST') {
        const result = await livePreviewService.confirmCompletion(requestId, actorFromUser(user, 'traveler'));
        return jsonResponse({ request: result }, 200, request);
      }

      if (action === 'dispute' && request.method === 'POST') {
        const result = await livePreviewService.disputeRequest(requestId, actorFromUser(user, 'traveler'));
        return jsonResponse({ request: result }, 200, request);
      }

      if (action === 'cancel' && request.method === 'POST') {
        const result = await livePreviewService.cancelRequest(requestId, actorFromUser(user, 'traveler'));
        return jsonResponse({ request: result }, 200, request);
      }
    }

    return jsonResponse({ error: 'Not found' }, 404, request);
  } catch (error) {
    return jsonResponse(
      { error: error instanceof Error ? error.message : 'Live preview API error' },
      400,
      request,
    );
  }
}

async function handleLivePreviewAdminApi(request: Request): Promise<Response> {
  const url = new URL(request.url);
  if (request.method !== 'GET') {
    return jsonResponse({ error: 'Method not allowed' }, 405, request);
  }

  const pathParts = url.pathname.split('/').filter(Boolean);
  const bucket = pathParts[pathParts.length - 1];
  if (bucket !== 'disputed' && bucket !== 'expired' && bucket !== 'completed') {
    return jsonResponse({ error: 'Unknown admin bucket' }, 404, request);
  }

  const requests = await livePreviewService.listAdminBucket(bucket);
  return jsonResponse({ requests }, 200, request);
}

async function handleItineraryEmail(request: Request, env: Env) {
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders(request) });
  }

  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405, request);
  }

  if (!env.RESEND_API_KEY) {
    return jsonResponse({ error: 'Email provider is not configured' }, 503, request);
  }

  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return jsonResponse({ error: 'Missing account ID token' }, 401, request);
  }

  const googleProfile = decodeJwtPayload(authHeader.slice('Bearer '.length));
  const verifiedEmail = googleProfile.email_verified === true;
  const tokenEmail = typeof googleProfile.email === 'string' ? googleProfile.email : '';

  if (!verifiedEmail || !tokenEmail) {
    return jsonResponse({ error: 'Google email is not verified' }, 403, request);
  }

  let payload: ItineraryEmailRequest;
  try {
    payload = (await request.json()) as ItineraryEmailRequest;
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400, request);
  }

  if (!payload.to || payload.to.toLowerCase() !== tokenEmail.toLowerCase()) {
    return jsonResponse({ error: 'Recipient must match the Google account email' }, 403, request);
  }

  if (!payload.itinerary?.title || !payload.itinerary.body) {
    return jsonResponse({ error: 'Missing itinerary content' }, 400, request);
  }

  const emailResponse = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: env.ITINERARY_EMAIL_FROM ?? 'Vinago+ <itinerary@aiautotool.com>',
      to: [payload.to],
      subject: `Vinago+ itinerary confirmation: ${payload.itinerary.title}`,
      text: buildPlainTextEmail(payload, tokenEmail),
    }),
  });

  if (!emailResponse.ok) {
    const errorText = await emailResponse.text();
    return jsonResponse({ error: 'Email provider rejected the request', detail: errorText }, 502, request);
  }

  const result = (await emailResponse.json()) as Record<string, unknown>;
  return jsonResponse({ ok: true, provider: 'resend', id: result.id ?? null }, 200, request);
}

async function assetResponse(request: Request, env: Env): Promise<Response> {
  const response = await env.ASSETS.fetch(request);
  const headers = new Headers(response.headers);
  headers.set('Cross-Origin-Embedder-Policy', 'credentialless');
  headers.set('Cross-Origin-Opener-Policy', 'same-origin');
  return new Response(response.body, {
    headers,
    status: response.status,
    statusText: response.statusText,
  });
}

function buildPlainTextEmail(payload: ItineraryEmailRequest, fallbackEmail: string) {
  const itinerary = payload.itinerary;
  const profile = payload.profile;
  const name = payload.name || fallbackEmail;

  return [
    `Hi ${name},`,
    '',
    `Here is your Vinago+ itinerary confirmation for ${itinerary?.city ?? profile?.currentCity ?? 'Vietnam'}.`,
    '',
    `Plan: ${itinerary?.title ?? 'Itinerary'}`,
    `Purpose: ${profile?.purpose ?? 'Travel'}`,
    `Language: ${profile?.language ?? 'English'}`,
    `Created: ${itinerary?.createdAt ?? new Date().toISOString()}`,
    '',
    itinerary?.body ?? '',
    '',
    'Have a great trip,',
    'Vinago+',
  ].join('\n');
}

async function handleQrAuthApi(
  request: Request,
  storage?: DurableObjectStorage,
): Promise<Response> {
  const url = new URL(request.url);
  if (!storage) cleanupQrAuthSessions();

  try {
    if (url.pathname === '/api/auth/qr/session' && request.method === 'POST') {
      const body = await readOptionalJsonBody<{ clientOrigin?: string }>(request);
      const sessionId = randomToken(18);
      const pollToken = randomToken(32);
      const approvalToken = randomToken(32);
      const expiresAt = Date.now() + QR_LOGIN_TTL_MS;
      const apiBaseUrl = url.origin;
      const qrData = `${APP_SCHEME}://auth/qr?api=${encodeURIComponent(apiBaseUrl)}&sessionId=${encodeURIComponent(sessionId)}&approvalToken=${encodeURIComponent(approvalToken)}`;

      await setQrLoginRecord({
        approvalToken,
        clientOrigin: safeClientOrigin(body?.clientOrigin),
        expiresAt,
        pollToken,
        sessionId,
        status: 'pending',
      }, storage);

      return jsonResponse(
        {
          ok: true,
          data: {
            expiresAt: new Date(expiresAt).toISOString(),
            pollToken,
            qrData,
            sessionId,
            status: 'pending',
          },
        },
        201,
        request,
      );
    }

    const pollRoute = url.pathname.match(/^\/api\/auth\/qr\/session\/([^/]+)\/?$/);
    if (pollRoute && request.method === 'GET') {
      const sessionId = pollRoute[1];
      const pollToken = url.searchParams.get('pollToken') ?? '';
      const record = await getQrLoginRecord(sessionId, storage);

      if (!record || record.pollToken !== pollToken) {
        return jsonResponse({ ok: false, error: 'QR login session not found' }, 404, request);
      }
      if (record.expiresAt <= Date.now()) {
        await deleteQrLoginRecord(record.sessionId, storage);
        return jsonResponse({ ok: true, data: { status: 'expired' } }, 200, request);
      }
      if (record.status !== 'approved' || !record.approvedUser || !record.webSessionToken || !record.webSessionExpiresAt) {
        return jsonResponse(
          {
            ok: true,
            data: {
              expiresAt: new Date(record.expiresAt).toISOString(),
              status: 'pending',
            },
          },
          200,
          request,
        );
      }

      return jsonResponse(
        {
          ok: true,
          data: {
            expiresAt: new Date(record.expiresAt).toISOString(),
            sessionToken: record.webSessionToken,
            status: 'approved',
            user: record.approvedUser,
            webSessionExpiresAt: new Date(record.webSessionExpiresAt).toISOString(),
          },
        },
        200,
        request,
      );
    }

    if (url.pathname === '/api/auth/qr/approve' && request.method === 'POST') {
      const authHeader = request.headers.get('Authorization');
      if (!authHeader?.startsWith('Bearer ')) {
        return jsonResponse({ ok: false, error: 'Missing account ID token' }, 401, request);
      }

      const body = await readJsonBody<{ sessionId?: string; approvalToken?: string }>(request);
      const sessionId = body.sessionId ?? '';
      const approvalToken = body.approvalToken ?? '';
      const record = await getQrLoginRecord(sessionId, storage);

      if (!record || record.approvalToken !== approvalToken) {
        return jsonResponse({ ok: false, error: 'QR login session not found' }, 404, request);
      }
      if (record.expiresAt <= Date.now()) {
        await deleteQrLoginRecord(record.sessionId, storage);
        return jsonResponse({ ok: false, error: 'QR login session expired' }, 410, request);
      }

      const user = qrLoginUserFromAccountToken(authHeader.slice('Bearer '.length));
      if (!user) {
        return jsonResponse({ ok: false, error: 'Account token is not valid' }, 403, request);
      }

      const webSessionToken = randomToken(36);
      const webSessionExpiresAt = Date.now() + QR_WEB_SESSION_TTL_MS;
      await setQrWebSessionRecord({
        expiresAt: webSessionExpiresAt,
        token: webSessionToken,
        user,
      }, storage);

      record.approvedUser = user;
      record.status = 'approved';
      record.webSessionExpiresAt = webSessionExpiresAt;
      record.webSessionToken = webSessionToken;
      await setQrLoginRecord(record, storage);

      return jsonResponse(
        {
          ok: true,
          data: {
            status: 'approved',
            user,
          },
        },
        200,
        request,
      );
    }

    if (url.pathname === '/api/auth/session/verify' && request.method === 'POST') {
      const body = await readJsonBody<{ sessionToken?: string }>(request);
      const sessionToken = body.sessionToken ?? '';
      const record = await getQrWebSessionRecord(sessionToken, storage);

      if (!record) {
        return jsonResponse({ ok: false, error: 'Web session not found' }, 404, request);
      }
      if (record.expiresAt <= Date.now()) {
        await deleteQrWebSessionRecord(record.token, storage);
        return jsonResponse({ ok: false, error: 'Web session expired' }, 410, request);
      }

      return jsonResponse(
        {
          ok: true,
          data: {
            expiresAt: new Date(record.expiresAt).toISOString(),
            user: record.user,
          },
        },
        200,
        request,
      );
    }

    return jsonResponse({ ok: false, error: 'Not found' }, 404, request);
  } catch (error) {
    return jsonResponse(
      { ok: false, error: error instanceof Error ? error.message : 'QR auth API error' },
      400,
      request,
    );
  }
}

function qrLoginUserFromAccountToken(token: string): QrLoginUser | null {
  const profile = decodeJwtPayload(token);
  const email = typeof profile.email === 'string' ? profile.email : '';
  const id =
    typeof profile.user_id === 'string'
      ? profile.user_id
      : typeof profile.sub === 'string'
        ? profile.sub
        : email;

  if (!id || !email || profile.email_verified === false) return null;

  return {
    email,
    givenName: typeof profile.given_name === 'string' ? profile.given_name : undefined,
    id,
    name:
      typeof profile.name === 'string'
        ? profile.name
        : typeof profile.given_name === 'string'
          ? profile.given_name
          : email,
    picture: typeof profile.picture === 'string' ? profile.picture : undefined,
    verifiedEmail: profile.email_verified === true,
  };
}

function cleanupQrAuthSessions() {
  const now = Date.now();
  for (const [sessionId, record] of qrLoginSessions.entries()) {
    if (record.expiresAt <= now) {
      qrLoginSessions.delete(sessionId);
    }
  }
  for (const [token, record] of qrWebSessions.entries()) {
    if (record.expiresAt <= now) {
      qrWebSessions.delete(token);
    }
  }
}

async function getQrLoginRecord(sessionId: string, storage?: DurableObjectStorage) {
  if (storage) {
    return storage.get<QrLoginRecord>(qrLoginStorageKey(sessionId));
  }
  return qrLoginSessions.get(sessionId);
}

async function setQrLoginRecord(record: QrLoginRecord, storage?: DurableObjectStorage) {
  if (storage) {
    await storage.put(qrLoginStorageKey(record.sessionId), record);
    return;
  }
  qrLoginSessions.set(record.sessionId, record);
}

async function deleteQrLoginRecord(sessionId: string, storage?: DurableObjectStorage) {
  if (storage) {
    await storage.delete(qrLoginStorageKey(sessionId));
    return;
  }
  qrLoginSessions.delete(sessionId);
}

async function getQrWebSessionRecord(token: string, storage?: DurableObjectStorage) {
  if (storage) {
    return storage.get<QrWebSessionRecord>(qrWebSessionStorageKey(token));
  }
  return qrWebSessions.get(token);
}

async function setQrWebSessionRecord(
  record: QrWebSessionRecord,
  storage?: DurableObjectStorage,
) {
  if (storage) {
    await storage.put(qrWebSessionStorageKey(record.token), record);
    return;
  }
  qrWebSessions.set(record.token, record);
}

async function deleteQrWebSessionRecord(token: string, storage?: DurableObjectStorage) {
  if (storage) {
    await storage.delete(qrWebSessionStorageKey(token));
    return;
  }
  qrWebSessions.delete(token);
}

async function cleanupQrAuthStorage(storage: DurableObjectStorage) {
  const now = Date.now();
  const deletions: string[] = [];
  const loginRecords = await storage.list<QrLoginRecord>({ prefix: QR_LOGIN_STORAGE_PREFIX });
  const webSessionRecords = await storage.list<QrWebSessionRecord>({
    prefix: QR_WEB_SESSION_STORAGE_PREFIX,
  });

  for (const [key, record] of loginRecords.entries()) {
    if (record.expiresAt <= now) deletions.push(key);
  }
  for (const [key, record] of webSessionRecords.entries()) {
    if (record.expiresAt <= now) deletions.push(key);
  }

  if (deletions.length > 0) {
    await storage.delete(deletions);
  }
}

function qrLoginStorageKey(sessionId: string) {
  return `${QR_LOGIN_STORAGE_PREFIX}${sessionId}`;
}

function qrWebSessionStorageKey(token: string) {
  return `${QR_WEB_SESSION_STORAGE_PREFIX}${token}`;
}

function safeClientOrigin(value: unknown) {
  if (typeof value !== 'string') return undefined;
  if (value.length > 512) return undefined;
  try {
    return new URL(value).origin;
  } catch {
    return undefined;
  }
}

function randomToken(byteLength: number) {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function decodeJwtPayload(token: string): Record<string, unknown> {
  try {
    const [, payload] = token.split('.');
    if (!payload) {
      return {};
    }

    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
    return JSON.parse(atob(padded)) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function authenticateWorkerUser(request: Request): WorkerUser | null {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  const profile = decodeJwtPayload(authHeader.slice('Bearer '.length));
  const email = typeof profile.email === 'string' ? profile.email : '';
  const id =
    typeof profile.user_id === 'string'
      ? profile.user_id
      : typeof profile.sub === 'string'
        ? profile.sub
        : email || `mock_user_${Math.random().toString(36).slice(2, 10)}`;

  return {
    id,
    email,
    name: typeof profile.name === 'string' ? profile.name : email || 'Vinago+ user',
  };
}

function actorFromUser(user: WorkerUser, role: LivePreviewActorRole): LivePreviewActor {
  return {
    id: user.id,
    name: user.name,
    role,
  };
}

function actorForRequest(
  user: WorkerUser,
  travelerId: string,
  helperId: string | null,
  preferredRole?: LivePreviewActorRole,
): LivePreviewActor {
  if (preferredRole === 'helper') return actorFromUser(user, 'helper');
  if (preferredRole === 'traveler') return actorFromUser(user, 'traveler');
  if (user.id === travelerId) return actorFromUser(user, 'traveler');
  if (helperId && user.id === helperId) return actorFromUser(user, 'helper');
  return actorFromUser(user, 'traveler');
}

async function readJsonBody<T>(request: Request): Promise<T> {
  try {
    return (await request.json()) as T;
  } catch {
    throw new Error('Invalid JSON body');
  }
}

async function readOptionalJsonBody<T>(request: Request): Promise<T | null> {
  const text = await request.text();
  if (!text.trim()) return null;
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error('Invalid JSON body');
  }
}

function jsonResponse(body: unknown, status: number, request: Request) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders(request),
      'Content-Type': 'application/json; charset=utf-8',
    },
  });
}

function corsHeaders(request: Request) {
  const origin = request.headers.get('Origin') ?? '*';

  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    Vary: 'Origin',
  };
}

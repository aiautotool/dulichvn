interface Env {
  ASSETS: Fetcher;
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

export default {
  async fetch(request, env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/api/itinerary-email') {
      return handleItineraryEmail(request, env);
    }

    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;

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
    return jsonResponse({ error: 'Missing Google ID token' }, 401, request);
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

function jsonResponse(body: Record<string, unknown>, status: number, request: Request) {
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
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    Vary: 'Origin',
  };
}

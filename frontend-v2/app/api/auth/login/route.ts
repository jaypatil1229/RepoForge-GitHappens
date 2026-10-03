import { NextRequest, NextResponse } from 'next/server';

import { backendBaseUrl, isSameOrigin, readJson, timestamp } from '@/lib/server/backend';
import { clearSessionCookies, newCsrfToken, setCsrfCookie, setSessionCookie } from '@/lib/server/session';
import { normalizeMembership, normalizeUser } from '@/lib/data/normalize';

export const dynamic = 'force-dynamic';

/** POST /api/auth/login — authenticate, set the HttpOnly session cookie, never return a token. */
export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ success: false, error: 'Cross-origin request rejected.', timestamp: timestamp() }, { status: 403 });
  }

  const body = await request.text();
  let upstream: Response;
  try {
    upstream = await fetch(`${backendBaseUrl()}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body,
      cache: 'no-store',
    });
  } catch {
    return NextResponse.json({ success: false, error: 'The authentication service could not be reached.', timestamp: timestamp() }, { status: 503 });
  }

  const payload = (await readJson(upstream)) as any;
  if (!upstream.ok || payload?.success !== true || !payload?.data?.session?.access_token) {
    const failure = payload?.success === false ? payload : { success: false, error: 'Sign-in failed.', timestamp: timestamp() };
    const response = NextResponse.json(failure, { status: upstream.status || 401 });
    clearSessionCookies(response);
    return response;
  }

  const data = payload.data;
  const response = NextResponse.json({
    success: true,
    message: payload.message,
    data: {
      user: normalizeUser(data.user),
      memberships: Array.isArray(data.memberships) ? data.memberships.map(normalizeMembership) : [],
    },
    timestamp: payload.timestamp ?? timestamp(),
  });
  setSessionCookie(response, data.session.access_token, data.session.expires_at);
  setCsrfCookie(response, newCsrfToken());
  return response;
}
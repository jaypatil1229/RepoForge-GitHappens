import { NextRequest, NextResponse } from 'next/server';

import { backendBaseUrl, readJson, timestamp } from '@/lib/server/backend';
import { SESSION_COOKIE, clearSessionCookies } from '@/lib/server/session';
import { normalizeMembership, normalizeUser } from '@/lib/data/normalize';

export const dynamic = 'force-dynamic';

/** GET /api/auth/me — resolve the current session from the HttpOnly cookie. */
export async function GET(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ success: false, error: 'Not authenticated.', code: 'unauthenticated', timestamp: timestamp() }, { status: 401 });
  }

  let upstream: Response;
  try {
    upstream = await fetch(`${backendBaseUrl()}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      cache: 'no-store',
    });
  } catch {
    return NextResponse.json({ success: false, error: 'The authentication service could not be reached.', timestamp: timestamp() }, { status: 503 });
  }

  const payload = (await readJson(upstream)) as any;
  if (!upstream.ok || payload?.success !== true) {
    const response = NextResponse.json(
      upstream.status === 401
        ? { success: false, error: 'Your session has expired. Sign in again.', code: 'session_expired', timestamp: timestamp() }
        : payload?.success === false
          ? payload
          : { success: false, error: 'The session could not be resolved.', timestamp: timestamp() },
      { status: upstream.status || 500 },
    );
    if (upstream.status === 401) clearSessionCookies(response);
    return response;
  }

  const data = payload.data ?? {};
  return NextResponse.json({
    success: true,
    data: {
      user: normalizeUser(data.user),
      memberships: Array.isArray(data.memberships) ? data.memberships.map(normalizeMembership) : [],
    },
    timestamp: payload.timestamp ?? timestamp(),
  });
}
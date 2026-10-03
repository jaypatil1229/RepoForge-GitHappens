import { NextRequest, NextResponse } from 'next/server';

import { backendBaseUrl, isSameOrigin, readJson, timestamp } from '@/lib/server/backend';
import { newCsrfToken, setCsrfCookie, setSessionCookie } from '@/lib/server/session';
import { normalizeUser } from '@/lib/data/normalize';
import type { AccountRole } from '@/lib/types';

export const dynamic = 'force-dynamic';

/**
 * POST /api/auth/register — create an account through the backend.
 *
 * The backend returns the raw profile row (snake_case) and no memberships, and it
 * silently downgrades a self-assigned ADMIN role to CITIZEN. The adapter normalizes
 * the user and derives the downgrade flag from the assignment the backend made.
 */
export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ success: false, error: 'Cross-origin request rejected.', timestamp: timestamp() }, { status: 403 });
  }

  const body = await request.text();
  let requestedRole: AccountRole = 'CITIZEN';
  try {
    const parsed = JSON.parse(body);
    if (typeof parsed?.role === 'string') requestedRole = parsed.role as AccountRole;
  } catch {
    // The backend will reject a malformed body; nothing to do here.
  }

  let upstream: Response;
  try {
    upstream = await fetch(`${backendBaseUrl()}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body,
      cache: 'no-store',
    });
  } catch {
    return NextResponse.json({ success: false, error: 'The authentication service could not be reached.', timestamp: timestamp() }, { status: 503 });
  }

  const payload = (await readJson(upstream)) as any;
  if (!upstream.ok || payload?.success !== true) {
    const failure = payload?.success === false ? payload : { success: false, error: 'Registration failed.', timestamp: timestamp() };
    return NextResponse.json(failure, { status: upstream.status || 400 });
  }

  const data = payload.data ?? {};
  const user = normalizeUser(data.user);
  const response = NextResponse.json({
    success: true,
    message: payload.message,
    data: {
      user,
      memberships: [],
      assignedRole: user.role,
      requestedRole,
      roleDowngraded: user.role !== requestedRole,
    },
    timestamp: payload.timestamp ?? timestamp(),
  });

  if (data?.session?.access_token) {
    setSessionCookie(response, data.session.access_token, data.session.expires_at);
    setCsrfCookie(response, newCsrfToken());
  }
  return response;
}
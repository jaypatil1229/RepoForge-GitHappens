import { NextRequest, NextResponse } from 'next/server';

import { backendBaseUrl, isSameOrigin, timestamp } from '@/lib/server/backend';
import { SESSION_COOKIE, clearSessionCookies } from '@/lib/server/session';

export const dynamic = 'force-dynamic';

/** POST /api/auth/logout — revoke the backend session best-effort, then clear cookies. */
export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ success: false, error: 'Cross-origin request rejected.', timestamp: timestamp() }, { status: 403 });
  }
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (token) {
    try {
      await fetch(`${backendBaseUrl()}/api/auth/logout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
        cache: 'no-store',
      });
    } catch {
      // Clearing the local cookie is what matters; the backend session will expire.
    }
  }

  const response = NextResponse.json({ success: true, message: 'Signed out successfully.', timestamp: timestamp() });
  clearSessionCookies(response);
  return response;
}
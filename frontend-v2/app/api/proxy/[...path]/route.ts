import { NextRequest, NextResponse } from 'next/server';

import { backendBaseUrl, isSameOrigin, timestamp } from '@/lib/server/backend';
import { CSRF_COOKIE, SESSION_COOKIE, clearSessionCookies } from '@/lib/server/session';

export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ path: string[] }> };

const MUTATING = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

function csrfValid(request: NextRequest): boolean {
  const cookie = request.cookies.get(CSRF_COOKIE)?.value;
  const header = request.headers.get('x-csrf-token');
  return Boolean(cookie) && cookie === header;
}

/**
 * Authenticated same-origin proxy.
 *
 * The Bearer token is read from the HttpOnly cookie and attached here, so it never
 * reaches browser JavaScript. Client-supplied credentials and origin headers are
 * dropped, hop-by-hop headers are never forwarded, and cross-site mutations are
 * rejected via an Origin check plus a double-submit CSRF token.
 */
async function proxyRequest(request: NextRequest, context: RouteContext): Promise<NextResponse> {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) {
    return NextResponse.json(
      { success: false, error: 'Authentication required.', code: 'unauthenticated', timestamp: timestamp() },
      { status: 401 },
    );
  }

  const method = request.method.toUpperCase();
  if (MUTATING.has(method)) {
    if (!isSameOrigin(request)) {
      return NextResponse.json({ success: false, error: 'Cross-origin request rejected.', timestamp: timestamp() }, { status: 403 });
    }
    if (!csrfValid(request)) {
      return NextResponse.json({ success: false, error: 'Invalid or missing CSRF token.', timestamp: timestamp() }, { status: 403 });
    }
  }

  const { path } = await context.params;
  const target = `${backendBaseUrl()}/api/${path.map(encodeURIComponent).join('/')}${request.nextUrl.search}`;

  const headers = new Headers({ Accept: 'application/json', Authorization: `Bearer ${token}` });
  const contentType = request.headers.get('content-type');
  if (contentType) headers.set('Content-Type', contentType);

  const body = method === 'GET' || method === 'HEAD' ? undefined : await request.text();

  let upstream: Response;
  try {
    upstream = await fetch(target, { method, headers, body, cache: 'no-store' });
  } catch {
    return NextResponse.json({ success: false, error: 'The service could not be reached.', timestamp: timestamp() }, { status: 503 });
  }

  if (upstream.status === 401) {
    const response = NextResponse.json(
      { success: false, error: 'Your session has expired. Sign in again.', code: 'session_expired', timestamp: timestamp() },
      { status: 401 },
    );
    clearSessionCookies(response);
    return response;
  }

  if (upstream.status >= 500) {
    return NextResponse.json(
      { success: false, error: 'The service reported an error. Please try again.', timestamp: timestamp() },
      { status: upstream.status },
    );
  }

  const text = await upstream.text();
  return new NextResponse(text, {
    status: upstream.status,
    headers: { 'content-type': upstream.headers.get('content-type') ?? 'application/json' },
  });
}

export const GET = proxyRequest;
export const POST = proxyRequest;
export const PATCH = proxyRequest;
export const PUT = proxyRequest;
export const DELETE = proxyRequest;
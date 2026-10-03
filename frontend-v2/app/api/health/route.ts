import { NextResponse } from 'next/server';

import { backendBaseUrl } from '@/lib/server/backend';

export const dynamic = 'force-dynamic';

/** GET /api/health — public pass-through to the backend health check (unwrapped shape). */
export async function GET() {
  try {
    const upstream = await fetch(`${backendBaseUrl()}/api/health`, { cache: 'no-store', headers: { Accept: 'application/json' } });
    const text = await upstream.text();
    return new NextResponse(text, {
      status: upstream.status,
      headers: { 'content-type': upstream.headers.get('content-type') ?? 'application/json' },
    });
  } catch {
    return NextResponse.json(
      { status: 'degraded', service: 'credlink-backend', version: 'unknown', timestamp: new Date().toISOString(), uptime: 0, database: { status: 'disconnected' } },
      { status: 503 },
    );
  }
}
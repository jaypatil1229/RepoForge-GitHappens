import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL =
  process.env.BACKEND_URL ||
  process.env.NEXT_PUBLIC_BACKEND_PRODUCTION_URL ||
  'https://credlink-20-production.up.railway.app';

async function proxyRequest(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const pathString = Array.isArray(path) ? path.join('/') : path;
  const search = req.nextUrl.search;
  const targetUrl = `${BACKEND_URL.replace(/\/+$/, '')}/api/${pathString}${search}`;

  const forwardHeaders = new Headers();
  req.headers.forEach((value, key) => {
    const lowerKey = key.toLowerCase();
    // Do NOT forward origin, host, or referer to avoid triggering Railway CORS policy 500 error
    if (
      lowerKey !== 'origin' &&
      lowerKey !== 'host' &&
      lowerKey !== 'referer' &&
      lowerKey !== 'content-length' &&
      lowerKey !== 'connection'
    ) {
      forwardHeaders.set(key, value);
    }
  });

  const method = req.method.toUpperCase();
  const body = ['GET', 'HEAD'].includes(method) ? undefined : await req.arrayBuffer();

  try {
    const backendResponse = await fetch(targetUrl, {
      method,
      headers: forwardHeaders,
      body,
      cache: 'no-store',
    });

    const responseHeaders = new Headers();
    backendResponse.headers.forEach((value, key) => {
      const lower = key.toLowerCase();
      if (lower !== 'content-encoding' && lower !== 'content-length') {
        responseHeaders.set(key, value);
      }
    });

    return new NextResponse(backendResponse.body, {
      status: backendResponse.status,
      statusText: backendResponse.statusText,
      headers: responseHeaders,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Backend proxy request failed';
    return NextResponse.json(
      {
        success: false,
        error: message,
        timestamp: new Date().toISOString(),
      },
      { status: 502 }
    );
  }
}

export const GET = proxyRequest;
export const POST = proxyRequest;
export const PUT = proxyRequest;
export const PATCH = proxyRequest;
export const DELETE = proxyRequest;
export const OPTIONS = proxyRequest;
export const HEAD = proxyRequest;

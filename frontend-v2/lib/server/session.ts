/**
 * Session cookie helpers for the same-origin auth proxy.
 *
 * The Supabase access token never reaches browser JavaScript: it lives in an
 * HttpOnly cookie and is attached to backend requests server-side. A separate,
 * non-HttpOnly CSRF cookie is paired with an X-CSRF-Token header (double-submit).
 */

import type { NextResponse } from 'next/server';

export const SESSION_COOKIE = 'cl_session';
export const CSRF_COOKIE = 'cl_csrf';

const SESSION_MAX_AGE_FALLBACK = 60 * 60;

/**
 * Supabase returns `expires_at` as a Unix epoch in seconds. Fall back to one hour
 * when it is absent so the cookie is still short-lived.
 */
export function sessionMaxAge(expiresAt?: number | null): number {
  if (typeof expiresAt === 'number' && Number.isFinite(expiresAt)) {
    const seconds = expiresAt - Math.floor(Date.now() / 1000);
    return Math.max(60, seconds);
  }
  return SESSION_MAX_AGE_FALLBACK;
}

export function setSessionCookie(
  response: NextResponse,
  accessToken: string,
  expiresAt?: number | null,
): void {
  response.cookies.set(SESSION_COOKIE, accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: sessionMaxAge(expiresAt),
  });
}

export function setCsrfCookie(response: NextResponse, token: string): void {
  response.cookies.set(CSRF_COOKIE, token, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 12,
  });
}

export function clearSessionCookies(response: NextResponse): void {
  response.cookies.set(SESSION_COOKIE, '', { path: '/', maxAge: 0 });
  response.cookies.set(CSRF_COOKIE, '', { path: '/', maxAge: 0 });
}

export function newCsrfToken(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  }
}
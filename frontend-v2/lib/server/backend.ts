/**
 * Server-side helpers for talking to the CredLink backend.
 *
 * These are only ever imported from route handlers. The backend base URL is a
 * server-side variable so it is never exposed to the browser bundle.
 */

const DEFAULT_BACKEND = 'https://credlink-20-production.up.railway.app';

export function backendBaseUrl(): string {
  const raw =
    process.env.BACKEND_URL ||
    process.env.NEXT_PUBLIC_BACKEND_PRODUCTION_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    DEFAULT_BACKEND;
  let cleaned = raw.trim().replace(/\/+$/, '');
  cleaned = cleaned.replace(/cred-link-production\.up\.railway\.app/gi, 'credlink-20-production.up.railway.app');
  cleaned = cleaned.replace(/https?:\/\/cred-link(-20)?-production\.up\.railway\.app/gi, 'https://credlink-20-production.up.railway.app');
  return cleaned;
}

export async function readJson(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export function timestamp(): string {
  return new Date().toISOString();
}

/** Reject cross-origin browser submissions before they touch the backend. */
export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get('origin');
  if (!origin) return true;
  const host = request.headers.get('host');
  if (!host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}
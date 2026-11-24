import type { Request, Response } from 'express';
import type { ApiConfig } from '../config.js';
import { HttpError } from '../middleware/errors.js';

export function requireJson(req: Request): void {
  const contentType = req.get('content-type') ?? '';
  if (!contentType.toLowerCase().startsWith('application/json')) {
    throw new HttpError(415, 'JSON_REQUIRED', 'errors.jsonRequired', 'This endpoint requires a JSON request body.');
  }
}

export function validateOrigin(req: Request, config: ApiConfig): void {
  const origin = req.get('origin');
  if (origin && origin !== config.allowedFrontendOrigin) {
    throw new HttpError(403, 'ORIGIN_NOT_ALLOWED', 'errors.originNotAllowed', 'The request origin is not allowed.');
  }
}

function parseCookies(header: string | undefined): Record<string, string> {
  const result: Record<string, string> = {};
  for (const part of (header ?? '').split(';')) {
    const index = part.indexOf('=');
    if (index <= 0) continue;
    const key = part.slice(0, index).trim();
    const value = part.slice(index + 1).trim();
    try { result[key] = decodeURIComponent(value); } catch { /* ignore malformed cookie */ }
  }
  return result;
}

export function readAuthCookie(req: Request, config: ApiConfig): string | undefined {
  return parseCookies(req.get('cookie'))[config.authCookieName];
}

function cookieValue(value: string): string { return encodeURIComponent(value); }
function sameSite(_value: ApiConfig['authCookieSameSite']): string { return 'Lax'; }

export function setAuthCookie(res: Response, token: string, config: ApiConfig): void {
  const secure = config.authCookieSecure ? '; Secure' : '';
  res.setHeader('Set-Cookie', `${config.authCookieName}=${cookieValue(token)}; Max-Age=${config.accessTokenLifetimeSeconds}; Path=/; HttpOnly; SameSite=${sameSite(config.authCookieSameSite)}${secure}`);
}

export function clearAuthCookie(res: Response, config: ApiConfig): void {
  const secure = config.authCookieSecure ? '; Secure' : '';
  res.setHeader('Set-Cookie', `${config.authCookieName}=; Max-Age=0; Path=/; HttpOnly; SameSite=${sameSite(config.authCookieSameSite)}${secure}`);
}

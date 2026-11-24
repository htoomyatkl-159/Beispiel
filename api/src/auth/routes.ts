import { Router } from 'express';
import type { PrismaClient } from '../generated/prisma/client.js';
import type { ApiConfig } from '../config.js';
import { HttpError } from '../middleware/errors.js';
import { hashPassword, verifyPassword } from './password.js';
import { createAccessToken } from './tokens.js';
import { clearAuthCookie, requireJson, setAuthCookie, validateOrigin } from './security.js';
import { publicUser } from './types.js';
import { requireAuthentication } from './middleware.js';

function input(body: unknown): { email: string; normalizedEmail: string; password: string; displayName: string } {
  if (!body || typeof body !== 'object') throw new HttpError(400, 'INVALID_INPUT', 'errors.invalidInput', 'Please provide valid registration details.');
  const value = body as Record<string, unknown>;
  const email = typeof value.email === 'string' ? value.email.trim() : '';
  const password = typeof value.password === 'string' ? value.password : '';
  const displayName = typeof value.displayName === 'string' ? value.displayName.trim() : '';
  if (!/^\S+@\S+\.\S+$/.test(email) || password.length < 12 || password.length > 1024 || displayName.length < 1 || displayName.length > 80) {
    throw new HttpError(400, 'INVALID_INPUT', 'errors.invalidInput', 'Enter a valid email, display name, and password of at least 12 characters.');
  }
  return { email, normalizedEmail: email.toLowerCase(), password, displayName };
}

function loginInput(body: unknown): { email: string; password: string } {
  if (!body || typeof body !== 'object') throw new HttpError(400, 'INVALID_INPUT', 'errors.invalidInput', 'Please provide an email and password.');
  const value = body as Record<string, unknown>;
  const email = typeof value.email === 'string' ? value.email.trim() : '';
  const password = typeof value.password === 'string' ? value.password : '';
  if (!email || !password) throw new HttpError(400, 'INVALID_INPUT', 'errors.invalidInput', 'Please provide an email and password.');
  return { email, password };
}

export function createAuthRouter(database: PrismaClient | undefined, config: ApiConfig | undefined): Router {
  const router = Router();
  const unavailable = () => { throw new HttpError(503, 'AUTH_UNAVAILABLE', 'errors.authUnavailable', 'Authentication is temporarily unavailable.'); };
  router.post('/auth/register', async (req, res, next) => { try {
    if (!database || !config) return unavailable(); requireJson(req); validateOrigin(req, config); const data = input(req.body);
    if (await database.user.findUnique({ where: { normalizedEmail: data.normalizedEmail } })) throw new HttpError(409, 'EMAIL_UNAVAILABLE', 'errors.emailUnavailable', 'That email address is already registered.');
    const user = await database.user.create({ data: { email: data.email, normalizedEmail: data.normalizedEmail, passwordHash: await hashPassword(data.password), displayName: data.displayName, role: 'USER', status: 'ACTIVE' } });
    setAuthCookie(res, await createAccessToken(user.id, config), config); res.status(201).json({ data: publicUser(user), meta: { requestId: res.locals.requestId } });
  } catch (e) { next(e); } });
  router.post('/auth/login', async (req, res, next) => { try {
    if (!database || !config) return unavailable(); requireJson(req); validateOrigin(req, config); const data = loginInput(req.body);
    const user = await database.user.findUnique({ where: { normalizedEmail: data.email.toLowerCase() } });
    if (!user || user.status !== 'ACTIVE' || !(await verifyPassword(data.password, user.passwordHash))) throw new HttpError(401, 'AUTHENTICATION_FAILED', 'errors.authenticationFailed', 'Email or password is incorrect.');
    const updated = await database.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    setAuthCookie(res, await createAccessToken(updated.id, config), config); res.json({ data: publicUser(updated), meta: { requestId: res.locals.requestId } });
  } catch (e) { next(e); } });
  router.post('/auth/logout', (req, res, next) => { try { if (!config) return unavailable(); requireJson(req); validateOrigin(req, config); clearAuthCookie(res, config); res.json({ data: { loggedOut: true }, meta: { requestId: res.locals.requestId } }); } catch (e) { next(e); } });
  router.get('/auth/me', (req, res, next) => { if (!database || !config) return next(new HttpError(503, 'AUTH_UNAVAILABLE', 'errors.authUnavailable', 'Authentication is temporarily unavailable.')); return requireAuthentication(database, config)(req, res, (error) => { if (error) return next(error); res.json({ data: req.authUser, meta: { requestId: res.locals.requestId } }); }); });
  return router;
}

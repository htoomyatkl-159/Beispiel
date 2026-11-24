import type { RequestHandler } from 'express';
import type { PrismaClient } from '../generated/prisma/client.js';
import type { ApiConfig } from '../config.js';
import { verifyAccessToken, TokenVerificationError } from './tokens.js';
import { HttpError } from '../middleware/errors.js';
import { readAuthCookie } from './security.js';

export function requireAuthentication(database: PrismaClient, config: ApiConfig): RequestHandler {
  return async (req, _res, next) => {
    try {
      const token = readAuthCookie(req, config);
      if (!token) throw new HttpError(401, 'AUTHENTICATION_REQUIRED', 'errors.authenticationRequired', 'Authentication is required.');
      let claims;
      try { claims = await verifyAccessToken(token, config); }
      catch (error) {
        if (error instanceof TokenVerificationError) throw new HttpError(401, 'AUTHENTICATION_REQUIRED', 'errors.authenticationRequired', 'Authentication is required.');
        throw error;
      }
      const user = await database.user.findUnique({ where: { id: claims.sub } });
      if (!user || user.status !== 'ACTIVE') throw new HttpError(401, 'AUTHENTICATION_REQUIRED', 'errors.authenticationRequired', 'Authentication is required.');
      req.authUser = { id: user.id, email: user.email, displayName: user.displayName, role: user.role, status: user.status, createdAt: user.createdAt };
      next();
    } catch (error) { next(error); }
  };
}

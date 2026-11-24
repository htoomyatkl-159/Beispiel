import { jwtVerify, SignJWT, type JWTPayload } from 'jose';
import type { ApiConfig } from '../config.js';

export class TokenVerificationError extends Error {}

function secret(config: ApiConfig): Uint8Array {
  return Buffer.from(config.jwtSecret, 'base64url');
}

export async function createAccessToken(userId: string, config: ApiConfig): Promise<string> {
  if (typeof userId !== 'string' || !userId.trim()) throw new TokenVerificationError('A non-empty user ID is required.');
  const subject = userId.trim();
  return new SignJWT({})
    .setProtectedHeader({ alg: config.jwtAlgorithm, typ: 'JWT' })
    .setSubject(subject)
    .setIssuedAt()
    .setExpirationTime(`${config.accessTokenLifetimeSeconds}s`)
    .setIssuer(config.jwtIssuer)
    .setAudience(config.jwtAudience)
    .sign(secret(config));
}

export async function verifyAccessToken(token: string, config: ApiConfig): Promise<Required<Pick<JWTPayload, 'sub' | 'iat' | 'exp' | 'iss' | 'aud'>>> {
  if (typeof token !== 'string' || !token.trim()) throw new TokenVerificationError('Invalid access token.');
  try {
    const { payload } = await jwtVerify(token, secret(config), {
      algorithms: [config.jwtAlgorithm], issuer: config.jwtIssuer, audience: config.jwtAudience,
    });
    if (typeof payload.sub !== 'string' || !payload.sub.trim() || typeof payload.iat !== 'number' ||
        typeof payload.exp !== 'number' || typeof payload.iss !== 'string' || typeof payload.aud !== 'string') {
      throw new TokenVerificationError('Invalid access token claims.');
    }
    return payload as Required<Pick<JWTPayload, 'sub' | 'iat' | 'exp' | 'iss' | 'aud'>>;
  } catch (error) {
    if (error instanceof TokenVerificationError) throw error;
    throw new TokenVerificationError('Invalid or expired access token.');
  }
}

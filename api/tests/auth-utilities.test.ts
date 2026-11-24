import { randomBytes } from 'node:crypto';
import { SignJWT } from 'jose';
import { describe, expect, it } from 'vitest';
import { readConfig } from '../src/config.js';
import { hashPassword, verifyPassword } from '../src/auth/password.js';
import { createAccessToken, TokenVerificationError, verifyAccessToken } from '../src/auth/tokens.js';

const config = readConfig({ JWT_SECRET: randomBytes(32).toString('base64url') });

describe('password utilities', () => {
  it('hashes and verifies a password without storing plaintext', async () => {
    const hash = await hashPassword('correct horse battery staple');
    expect(hash).toMatch(/^scrypt\$v1\$N=32768,r=8,p=1\$/);
    expect(hash).not.toContain('correct horse');
    expect(await verifyPassword('correct horse battery staple', hash)).toBe(true);
    expect(await verifyPassword('wrong password', hash)).toBe(false);
  });

  it('uses a different random salt for identical passwords', async () => {
    expect(await hashPassword('same password')).not.toBe(await hashPassword('same password'));
  });

  it.each(['', 'x'.repeat(1025)])('rejects invalid passwords consistently', async (password) => {
    await expect(hashPassword(password)).rejects.toThrow('Password');
    expect(await verifyPassword(password, 'scrypt$v1$N=32768,r=8,p=1$bad$bad')).toBe(false);
  });

  it('rejects malformed, unsupported, and unsafe parameter formats', async () => {
    const valid = await hashPassword('valid password');
    for (const value of ['', 'plain text', valid.replace('$v1$', '$v2$'), valid.replace('N=32768', 'N=1'), valid.replace('r=8', 'r=999')]) {
      expect(await verifyPassword('valid password', value)).toBe(false);
    }
  });
});

describe('JWT utilities', () => {
  it('creates and verifies a minimal access token', async () => {
    const token = await createAccessToken('user_123', config);
    const claims = await verifyAccessToken(token, config);
    expect(claims).toMatchObject({ sub: 'user_123', iss: 'beispiel-api', aud: 'beispiel-web' });
    expect(Object.keys(claims).sort()).toEqual(['aud', 'exp', 'iat', 'iss', 'sub']);
  });

  it('rejects empty subjects and malformed tokens', async () => {
    await expect(createAccessToken('  ', config)).rejects.toBeInstanceOf(TokenVerificationError);
    await expect(verifyAccessToken('not.a.jwt', config)).rejects.toBeInstanceOf(TokenVerificationError);
  });

  it('normalizes surrounding subject whitespace without adding claims', async () => {
    const token = await createAccessToken('  user_123  ', config);
    expect((await verifyAccessToken(token, config)).sub).toBe('user_123');
  });

  it('rejects wrong signature, issuer, audience, algorithm, and expiration', async () => {
    const token = await createAccessToken('user_123', config);
    const other = readConfig({ JWT_SECRET: randomBytes(32).toString('base64url') });
    await expect(verifyAccessToken(token, other)).rejects.toBeInstanceOf(TokenVerificationError);
    await expect(verifyAccessToken(token, { ...config, jwtIssuer: 'other-api' })).rejects.toBeInstanceOf(TokenVerificationError);
    await expect(verifyAccessToken(token, { ...config, jwtAudience: 'other-web' })).rejects.toBeInstanceOf(TokenVerificationError);
    const wrongAlgorithm = await new SignJWT({}).setProtectedHeader({ alg: 'HS384', typ: 'JWT' }).setSubject('user_123').setIssuedAt().setExpirationTime('15m').setIssuer(config.jwtIssuer).setAudience(config.jwtAudience).sign(Buffer.from(config.jwtSecret, 'base64url'));
    await expect(verifyAccessToken(wrongAlgorithm, config)).rejects.toBeInstanceOf(TokenVerificationError);
    const expired = await new SignJWT({}).setProtectedHeader({ alg: 'HS256', typ: 'JWT' }).setSubject('user_123').setIssuedAt().setExpirationTime('0s').setIssuer(config.jwtIssuer).setAudience(config.jwtAudience).sign(Buffer.from(config.jwtSecret, 'base64url'));
    await expect(verifyAccessToken(expired, config)).rejects.toBeInstanceOf(TokenVerificationError);
  });
});

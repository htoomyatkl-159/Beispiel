import { describe, expect, it } from 'vitest';
import { readConfig } from '../src/config.js';

describe('startup configuration', () => {
  it('has safe local defaults including the M07 authentication contract', () => {
    expect(readConfig({})).toMatchObject({ host: '127.0.0.1', port: 4000, nodeEnv: 'development', recommenderBaseUrl: 'http://127.0.0.1:8000', jwtIssuer: 'beispiel-api', jwtAudience: 'beispiel-web', jwtAlgorithm: 'HS256', accessTokenLifetimeSeconds: 900, authCookieName: 'beispiel_access', allowedFrontendOrigin: 'http://127.0.0.1:5173', authCookieHttpOnly: true, authCookieSecure: false, authCookieSameSite: 'lax' });
  });

  it('accepts valid configured settings', () => {
    expect(readConfig({ HOST: 'localhost', PORT: '4500', NODE_ENV: 'test' }))
      .toMatchObject({ host: 'localhost', port: 4500, nodeEnv: 'test' });
    expect(readConfig({ HOST: '::1' }).host).toBe('::1');
  });

  it.each(['', '0', '-1', '65536', 'four', '4000.5', '4e3', ' 4000 '])('rejects invalid PORT %j', (port) => {
    expect(() => readConfig({ PORT: port })).toThrow('PORT must be');
  });

  it('rejects invalid host and environment rather than silently falling back', () => {
    expect(() => readConfig({ HOST: '' })).toThrow('HOST must be');
    expect(() => readConfig({ NODE_ENV: 'unknown' })).toThrow('NODE_ENV must be');
  });

  it('accepts a strong secret and configured authentication values', () => {
    expect(readConfig({ NODE_ENV: 'production', JWT_SECRET: '0123456789abcdef'.repeat(4), JWT_ACCESS_TOKEN_TTL_SECONDS: '900', ALLOWED_FRONTEND_ORIGIN: 'https://example.test', JWT_ISSUER: ' api ', JWT_AUDIENCE: ' web ' }))
      .toMatchObject({ nodeEnv: 'production', accessTokenLifetimeSeconds: 900, allowedFrontendOrigin: 'https://example.test', jwtIssuer: 'api', jwtAudience: 'web', authCookieSecure: true, authCookieHttpOnly: true, authCookieSameSite: 'lax' });
  });

  it.each([
    [{ NODE_ENV: 'production' }, 'JWT_SECRET'],
    [{ NODE_ENV: 'production', JWT_SECRET: 'too-short' }, '32 bytes'],
    [{ JWT_ALGORITHM: 'none' }, 'HS256'],
    [{ JWT_ACCESS_TOKEN_TTL_SECONDS: '30' }, 'between 60'],
    [{ ALLOWED_FRONTEND_ORIGIN: 'http://127.0.0.1:5173/path' }, 'origin'],
    [{ ALLOWED_FRONTEND_ORIGIN: 'http://user:password@127.0.0.1:5173' }, 'origin'],
    [{ AUTH_COOKIE_NAME: 'bad cookie' }, 'AUTH_COOKIE_NAME'],
    [{ JWT_ISSUER: '   ' }, 'must not be empty'],
    [{ JWT_AUDIENCE: '\t' }, 'must not be empty'],
  ])('rejects unsafe authentication configuration %j', (env, message) => {
    expect(() => readConfig(env)).toThrow(message);
  });

  it('accepts localhost and HTTPS origins while rejecting malformed TTL values', () => {
    expect(readConfig({ ALLOWED_FRONTEND_ORIGIN: 'http://localhost:5173' }).allowedFrontendOrigin).toBe('http://localhost:5173');
    expect(readConfig({ ALLOWED_FRONTEND_ORIGIN: 'https://beispiel.example' }).allowedFrontendOrigin).toBe('https://beispiel.example');
    for (const ttl of ['', ' ', '1.5', '-1', 'abc', '3601']) expect(() => readConfig({ JWT_ACCESS_TOKEN_TTL_SECONDS: ttl })).toThrow('JWT_ACCESS_TOKEN_TTL_SECONDS');
  });
});

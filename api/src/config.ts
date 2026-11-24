import { isIP } from 'node:net';

export type NodeEnvironment = 'development' | 'test' | 'production';
export type JwtAlgorithm = 'HS256';
export type AuthCookieSameSite = 'lax' | 'none';

export interface ApiConfig {
  host: string;
  port: number;
  nodeEnv: NodeEnvironment;
  recommenderBaseUrl: string;
  recommenderTimeoutMs: number;
  jwtSecret: string;
  jwtIssuer: string;
  jwtAudience: string;
  jwtAlgorithm: JwtAlgorithm;
  accessTokenLifetimeSeconds: number;
  authCookieName: string;
  allowedFrontendOrigin: string;
  authCookieHttpOnly: true;
  authCookieSecure: boolean;
  authCookieSameSite: AuthCookieSameSite;
}

const DEVELOPMENT_JWT_SECRET = 'development-only-secret-change-me-before-production';

function secretByteLength(value: string): number {
  if (!/^[A-Za-z0-9_-]+$/.test(value)) return 0;
  try { return Buffer.from(value, 'base64url').length; } catch { return 0; }
}

function validateOrigin(value: string): string {
  let parsed: URL;
  try { parsed = new URL(value); } catch { throw new Error('ALLOWED_FRONTEND_ORIGIN must be a valid http or https origin.'); }
  if ((parsed.protocol !== 'http:' && parsed.protocol !== 'https:') || parsed.username || parsed.password || parsed.pathname !== '/' || parsed.search || parsed.hash) {
    throw new Error('ALLOWED_FRONTEND_ORIGIN must be an origin such as http://127.0.0.1:5173.');
  }
  return parsed.origin;
}

/** Read configuration explicitly at startup, not as an import side effect. */
export function readConfig(env: NodeJS.ProcessEnv = process.env): ApiConfig {
  const rawPort = env.PORT ?? '4000';
  const port = Number(rawPort);
  if (!/^\d+$/.test(rawPort) || !Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT must be a whole number between 1 and 65535.');
  }
  const host = env.HOST ?? '127.0.0.1';
  if (host !== 'localhost' && !isIP(host)) {
    throw new Error('HOST must be localhost or a valid IP address (for example 127.0.0.1).');
  }
  const nodeEnv = env.NODE_ENV ?? 'development';
  if (nodeEnv !== 'development' && nodeEnv !== 'test' && nodeEnv !== 'production') {
    throw new Error('NODE_ENV must be development, test, or production.');
  }
  const recommenderBaseUrl = env.RECOMMENDER_BASE_URL ?? 'http://127.0.0.1:8000';
  if (!/^https?:\/\//.test(recommenderBaseUrl)) throw new Error('RECOMMENDER_BASE_URL must be an http or https URL.');
  const recommenderTimeoutMs = Number(env.RECOMMENDER_TIMEOUT_MS ?? '2500');
  if (!Number.isInteger(recommenderTimeoutMs) || recommenderTimeoutMs < 100 || recommenderTimeoutMs > 30000) throw new Error('RECOMMENDER_TIMEOUT_MS must be between 100 and 30000.');
  const configuredSecret = env.JWT_SECRET?.trim();
  const jwtSecret = configuredSecret || (nodeEnv === 'production' ? '' : DEVELOPMENT_JWT_SECRET);
  if (!jwtSecret || (nodeEnv === 'production' && jwtSecret === DEVELOPMENT_JWT_SECRET)) throw new Error('JWT_SECRET is required in production and must not use a development default.');
  if (secretByteLength(jwtSecret) < 32) throw new Error('JWT_SECRET must contain at least 32 bytes of random material.');
  const jwtIssuer = (env.JWT_ISSUER ?? 'beispiel-api').trim();
  const jwtAudience = (env.JWT_AUDIENCE ?? 'beispiel-web').trim();
  if (!jwtIssuer || !jwtAudience) throw new Error('JWT_ISSUER and JWT_AUDIENCE must not be empty.');
  const jwtAlgorithm = env.JWT_ALGORITHM ?? 'HS256';
  if (jwtAlgorithm !== 'HS256') throw new Error('JWT_ALGORITHM must be HS256.');
  const accessTokenLifetimeSeconds = Number(env.JWT_ACCESS_TOKEN_TTL_SECONDS ?? '900');
  if (!Number.isInteger(accessTokenLifetimeSeconds) || accessTokenLifetimeSeconds < 60 || accessTokenLifetimeSeconds > 3600) throw new Error('JWT_ACCESS_TOKEN_TTL_SECONDS must be a whole number between 60 and 3600.');
  const authCookieName = env.AUTH_COOKIE_NAME ?? 'beispiel_access';
  if (!/^[A-Za-z0-9_-]{1,64}$/.test(authCookieName)) throw new Error('AUTH_COOKIE_NAME must contain only letters, numbers, underscores, or hyphens.');
  const allowedFrontendOrigin = validateOrigin(env.ALLOWED_FRONTEND_ORIGIN ?? 'http://127.0.0.1:5173');
  const authCookieSameSite = (env.AUTH_COOKIE_SAMESITE ?? 'lax').toLowerCase();
  if (authCookieSameSite !== 'lax' && authCookieSameSite !== 'none') throw new Error('AUTH_COOKIE_SAMESITE must be lax or none.');
  if (nodeEnv === 'production' && authCookieSameSite === 'none' && !configuredSecret) throw new Error('Production cookie configuration is invalid.');
  return { host, port, nodeEnv, recommenderBaseUrl, recommenderTimeoutMs, jwtSecret, jwtIssuer, jwtAudience,
    jwtAlgorithm, accessTokenLifetimeSeconds, authCookieName, allowedFrontendOrigin,
    authCookieHttpOnly: true, authCookieSecure: nodeEnv === 'production', authCookieSameSite };
}

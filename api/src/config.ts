import { isIP } from 'node:net';

export type NodeEnvironment = 'development' | 'test' | 'production';

export interface ApiConfig {
  host: string;
  port: number;
  nodeEnv: NodeEnvironment;
  recommenderBaseUrl: string;
  recommenderTimeoutMs: number;
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
  return { host, port, nodeEnv, recommenderBaseUrl, recommenderTimeoutMs };
}

import { describe, expect, it } from 'vitest';
import { readConfig } from '../src/config.js';

describe('startup configuration', () => {
  it('has independent local defaults without database, auth, or Python settings', () => {
    expect(readConfig({})).toMatchObject({ host: '127.0.0.1', port: 4000, nodeEnv: 'development', recommenderBaseUrl: 'http://127.0.0.1:8000' });
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
});

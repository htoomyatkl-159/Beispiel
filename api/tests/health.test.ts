import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';

describe('standalone API', () => {
  it('returns live health without a database or Python service', async () => {
    const response = await request(createApp()).get('/api/v1/health/live').expect(200);
    expect(response.headers['content-type']).toMatch(/application\/json/);
    expect(response.body.data).toEqual({ status: 'ok' });
    expect(response.body.meta.requestId).toMatch(/^[0-9a-f-]{36}$/);
    expect(response.headers['x-request-id']).toBe(response.body.meta.requestId);
    expect(response.headers['cache-control']).toBe('no-store');
    expect(response.headers['x-powered-by']).toBeUndefined();
    expect(Object.keys(response.body).sort()).toEqual(['data', 'meta']);
  });

  it('generates separate IDs and does not echo an untrusted request ID', async () => {
    const app = createApp();
    const first = await request(app).get('/api/v1/health/live').set('X-Request-Id', 'caller-controlled');
    const second = await request(app).get('/api/v1/health/live');
    expect(first.body.meta.requestId).not.toBe('caller-controlled');
    expect(first.body.meta.requestId).not.toBe(second.body.meta.requestId);
  });

  it.each(['/', '/api/v1/missing', '/api/v1/health/ready'])('returns structured 404 for %s', async (path) => {
    const response = await request(createApp()).get(path).expect(404);
    expect(response.body).toEqual({
      error: {
        code: 'NOT_FOUND', messageKey: 'errors.notFound',
        message: 'The requested resource was not found.', requestId: response.headers['x-request-id'],
      },
    });
    expect(response.headers['content-type']).toMatch(/application\/json/);
  });

  it('handles malformed JSON with the same safe error envelope', async () => {
    const response = await request(createApp()).post('/api/v1/missing')
      .set('Content-Type', 'application/json').send('{"password":"private",').expect(400);
    expect(response.body.error.code).toBe('INVALID_JSON');
    expect(response.body.error.requestId).toBe(response.headers['x-request-id']);
    expect(JSON.stringify(response.body)).not.toContain('private');
    expect(response.body.error.stack).toBeUndefined();
  });

  it('rejects oversized JSON without returning submitted data', async () => {
    const response = await request(createApp()).post('/api/v1/missing')
      .send({ value: 'x'.repeat(20_000) }).expect(413);
    expect(response.body.error.code).toBe('PAYLOAD_TOO_LARGE');
    expect(response.body.error.requestId).toBe(response.headers['x-request-id']);
  });

  it('handles unsupported JSON charsets with a structured error', async () => {
    const response = await request(createApp()).post('/api/v1/missing')
      .set('Content-Type', 'application/json; charset=iso-8859-1').send('{}').expect(415);
    expect(response.body.error.code).toBe('UNSUPPORTED_ENCODING');
  });

  it('keeps unsupported methods in the JSON not-found contract', async () => {
    const response = await request(createApp()).post('/api/v1/health/live').send({}).expect(404);
    expect(response.body.error.code).toBe('NOT_FOUND');
  });
});

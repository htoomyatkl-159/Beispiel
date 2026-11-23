import express from 'express';
import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import { createErrorHandler, HttpError, notFound } from '../src/middleware/errors.js';
import { requestContext } from '../src/middleware/request-context.js';

// Fault routes exist only in this test harness, never in the real createApp().
describe('shared error middleware', () => {
  function harness(asyncFailure = false) {
    const report = vi.fn();
    const app = express();
    app.use(requestContext);
    if (asyncFailure) {
      app.get('/failure', async () => { throw new Error('private database details'); });
    } else {
      app.get('/failure', () => { throw new Error('private database details'); });
    }
    app.get('/expected', () => {
      throw new HttpError(400, 'VALIDATION_ERROR', 'errors.validation', 'The request is invalid.');
    });
    app.use(notFound);
    app.use(createErrorHandler(report));
    return { app, report };
  }

  it.each([false, true])('sanitizes synchronous/asynchronous failures (async=%s)', async (asyncFailure) => {
    const { app, report } = harness(asyncFailure);
    const response = await request(app).get('/failure?token=private').expect(500);
    expect(response.body).toEqual({ error: {
      code: 'INTERNAL_ERROR', messageKey: 'errors.internal',
      message: 'An unexpected error occurred.', requestId: response.headers['x-request-id'],
    } });
    expect(report).toHaveBeenCalledWith({
      event: 'request_failed', requestId: response.headers['x-request-id'],
      code: 'INTERNAL_ERROR', statusCode: 500, method: 'GET',
    });
    expect(JSON.stringify([response.body, report.mock.calls])).not.toContain('private');
  });

  it('returns deliberately public validation errors without reporting them as server failures', async () => {
    const { app, report } = harness();
    const response = await request(app).get('/expected').expect(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
    expect(response.body.error.message).toBe('The request is invalid.');
    expect(report).not.toHaveBeenCalled();
  });
});

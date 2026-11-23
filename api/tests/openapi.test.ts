import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';
import { createApp } from '../src/app.js';

describe('initial OpenAPI contract', () => {
  it('documents the real implemented route and response fields', async () => {
    const filename = fileURLToPath(new URL('../openapi.yaml', import.meta.url));
    const spec = parse(readFileSync(filename, 'utf8'));
    expect(spec.openapi).toBe('3.1.0');
    expect(Object.keys(spec.paths).sort()).toEqual([
      '/api/v1/health/live', '/api/v1/search', '/api/v1/tracks', '/api/v1/tracks/{id}',
    ]);
    expect(spec.paths['/api/v1/health/live'].get.responses['200'].content['application/json'].schema.$ref)
      .toBe('#/components/schemas/HealthResponse');
    const response = await request(createApp()).get('/api/v1/health/live').expect(200);
    expect(Object.keys(response.body).sort()).toEqual([...spec.components.schemas.HealthResponse.required].sort());
    expect(response.body.data.status).toBe(spec.components.schemas.HealthResponse.properties.data.properties.status.const);
    const missing = await request(createApp()).get('/missing').expect(404);
    expect(Object.keys(missing.body.error).sort())
      .toEqual([...spec.components.schemas.ErrorEnvelope.properties.error.required].sort());
  });
});

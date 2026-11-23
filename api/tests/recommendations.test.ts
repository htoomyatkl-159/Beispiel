import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';

const seed = { id: 'internal-seed', source: 'spotify-tracks', sourceTrackId: 'seed-source', title: 'Seed', artistsText: 'Artist', albumName: null, genre: 'demo', popularity: 1, durationMs: 1000, explicit: false, catalogVersion: 'catalog-v1-test' };
const result = { ...seed, id: 'internal-result', sourceTrackId: 'result-source', title: 'Result' };
const db = { track: { findFirst: async () => seed, findMany: async () => [result] } } as never;
const recommender = { similar: async () => ({ seedSourceTrackId: 'seed-source', catalogVersion: 'catalog-v1-test', modelVersion: 'cosine-v1-test', results: [{ sourceTrackId: 'result-source', title: 'Result', artists: 'Artist', cosineDistance: 0.2, cosineSimilarity: 0.8, reasonCode: 'SIMILAR_AUDIO_FEATURES' }] }) };

describe('similar-song API', () => {
  it('maps the application ID through the private recommender and resolves metadata', async () => {
    const response = await request(createApp({ database: db, recommender })).post('/api/v1/recommendations/similar').send({ trackId: 'internal-seed', limit: 5 }).expect(200);
    expect(response.body.data[0].track).toMatchObject({ id: 'internal-result', sourceTrackId: 'result-source' });
    expect(response.body.data[0].similarity).toBe(0.8);
  });
  it('rejects invalid requests before contacting the recommender', async () => {
    await request(createApp({ database: db, recommender })).post('/api/v1/recommendations/similar').send({ trackId: '', limit: 0 }).expect(400);
  });
  it('returns a safe unavailable response when Python is not configured', async () => {
    const response = await request(createApp({ database: db })).post('/api/v1/recommendations/similar').send({ trackId: 'internal-seed' }).expect(503);
    expect(response.body.error.code).toBe('RECOMMENDER_UNAVAILABLE');
  });
});

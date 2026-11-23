import { Router } from 'express';
import type { PrismaClient } from '../generated/prisma/client.js';
import { HttpError } from '../middleware/errors.js';
import { getTrack, listTracks } from './service.js';
import { parseListQuery, parseSearchQuery, parseTrackId } from './validation.js';

export function createCatalogRouter(database?: PrismaClient) {
  const router = Router();
  const db = () => {
    if (!database) throw new HttpError(503, 'CATALOG_UNAVAILABLE', 'errors.catalogUnavailable', 'The catalog database is not configured.');
    return database;
  };
  router.get('/tracks', async (req, res) => {
    const result = await listTracks(db(), parseListQuery(req.query));
    res.json({ ...result, meta: { ...result.meta, requestId: res.locals.requestId } });
  });
  router.get('/tracks/:id', async (req, res) => {
    const track = await getTrack(db(), parseTrackId(req.params.id));
    res.json({ data: track, meta: { requestId: res.locals.requestId } });
  });
  router.get('/search', async (req, res) => {
    const result = await listTracks(db(), parseSearchQuery(req.query));
    res.json({ ...result, meta: { ...result.meta, requestId: res.locals.requestId } });
  });
  return router;
}

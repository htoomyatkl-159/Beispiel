import { Router } from 'express';
import type { PrismaClient } from '../generated/prisma/client.js';
import { HttpError } from '../middleware/errors.js';
import { findSimilar } from './service.js';
import type { RecommenderClient } from './client.js';

export function createRecommendationRouter(database: PrismaClient | undefined, recommender: RecommenderClient | undefined) {
  const router = Router();
  router.post('/recommendations/similar', async (req, res) => {
    if (!database) throw new HttpError(503, 'CATALOG_UNAVAILABLE', 'errors.catalogUnavailable', 'The catalog database is not configured.');
    if (!recommender) throw new HttpError(503, 'RECOMMENDER_UNAVAILABLE', 'errors.recommenderUnavailable', 'The recommendation service is unavailable.');
    const body = (req.body && typeof req.body === 'object' && !Array.isArray(req.body)) ? req.body as Record<string, unknown> : {};
    if (typeof body.trackId !== 'string' || !/^.{1,100}$/.test(body.trackId) || (body.limit !== undefined && (!Number.isInteger(body.limit) || (body.limit as number) < 1 || (body.limit as number) > 20))) {
      throw new HttpError(400, 'VALIDATION_ERROR', 'errors.validation', 'trackId is required and limit must be an integer between 1 and 20.');
    }
    const result = await findSimilar(database, recommender, body.trackId, (body.limit as number | undefined) ?? 5);
    res.json({ ...result, meta: { ...result.meta, requestId: res.locals.requestId } });
  });
  return router;
}

import { Router } from 'express';
import type { PrismaClient } from '../generated/prisma/client.js';
import type { ApiConfig } from '../config.js';
import { HttpError } from '../middleware/errors.js';
import { requireAuthentication } from '../auth/middleware.js';
import { requireJson, validateOrigin } from '../auth/security.js';

const allowed = new Set(['LIKE', 'DISLIKE']);
function trackId(value: string | string[] | undefined): string { if (typeof value !== 'string' || !value.trim() || value.length > 100) throw new HttpError(400, 'INVALID_TRACK_ID', 'errors.validation', 'A valid track ID is required.'); return value; }
export function createFeedbackRouter(database: PrismaClient | undefined, config: ApiConfig | undefined) {
  const router = Router();
  if (!database || !config) return router;
  const auth = requireAuthentication(database, config);
  router.get('/feedback', auth, async (req, res, next) => { try {
    const rows = await database.trackFeedback.findMany({ where: { userId: req.authUser!.id }, orderBy: { updatedAt: 'desc' }, select: { id: true, trackId: true, feedbackType: true, createdAt: true, updatedAt: true } });
    res.json({ data: rows, meta: { requestId: res.locals.requestId } });
  } catch (e) { next(e); } });
  router.get('/tracks/:trackId/feedback', auth, async (req, res, next) => { try {
    const id = trackId(req.params.trackId); const row = await database.trackFeedback.findUnique({ where: { userId_trackId: { userId: req.authUser!.id, trackId: id } }, select: { id: true, trackId: true, feedbackType: true, createdAt: true, updatedAt: true } });
    res.json({ data: row, meta: { requestId: res.locals.requestId } });
  } catch (e) { next(e); } });
  router.put('/tracks/:trackId/feedback', auth, async (req, res, next) => { try {
    const id = trackId(req.params.trackId); requireJson(req); validateOrigin(req, config); const type = req.body && typeof req.body.feedbackType === 'string' ? req.body.feedbackType.toUpperCase() : '';
    if (!allowed.has(type)) throw new HttpError(400, 'INVALID_FEEDBACK', 'errors.invalidFeedback', 'feedbackType must be LIKE or DISLIKE.');
    const track = await database.track.findFirst({ where: { id, status: 'PUBLISHED' }, select: { id: true } });
    if (!track) throw new HttpError(404, 'TRACK_NOT_FOUND', 'errors.trackNotFound', 'The requested track was not found.');
    const row = await database.trackFeedback.upsert({ where: { userId_trackId: { userId: req.authUser!.id, trackId: id } }, create: { userId: req.authUser!.id, trackId: id, feedbackType: type }, update: { feedbackType: type } });
    res.json({ data: row, meta: { requestId: res.locals.requestId } });
  } catch (e) { next(e); } });
  router.delete('/tracks/:trackId/feedback', auth, async (req, res, next) => { try {
    validateOrigin(req, config); await database.trackFeedback.deleteMany({ where: { userId: req.authUser!.id, trackId: trackId(req.params.trackId) } });
    res.json({ data: { removed: true }, meta: { requestId: res.locals.requestId } });
  } catch (e) { next(e); } });
  return router;
}

import { Router } from 'express';
import type { PrismaClient } from '../generated/prisma/client.js';
import { HttpError } from '../middleware/errors.js';
import { findSimilar } from './service.js';
import type { RecommenderClient } from './client.js';
import type { ApiConfig } from '../config.js';
import { requireAuthentication } from '../auth/middleware.js';

export function createRecommendationRouter(database: PrismaClient | undefined, recommender: RecommenderClient | undefined, config?: ApiConfig) {
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
  if (database && recommender && config) router.get('/recommendations/for-you', requireAuthentication(database, config), async (req, res) => {
    const mode = req.query.mode === 'familiar' || req.query.mode === 'adventurous' ? req.query.mode : 'balanced';
    const limit = Math.min(Math.max(Number(req.query.limit ?? 10) || 10, 1), 20);
    const feedback = await database.trackFeedback.findMany({ where: { userId: req.authUser!.id }, select: { trackId: true, feedbackType: true } });
    const liked = feedback.filter((x) => x.feedbackType === 'LIKE').map((x) => x.trackId);
    const excluded = new Set(feedback.map((x) => x.trackId));
    if (!liked.length) return res.json({ data: [], meta: { coldStart: true, mode, requestId: res.locals.requestId } });
    const seeds = await database.track.findMany({ where: { id: { in: liked }, status: 'PUBLISHED' }, select: { id:true, sourceTrackId:true, catalogVersion:true, source:true } });
    const scores = new Map<string, { score:number; seedCount:number }>();
    for (const seed of seeds.slice(0, 5)) { const result = await recommender.similar({ sourceTrackId: seed.sourceTrackId, catalogVersion: seed.catalogVersion, limit: 20 }); for (const item of result.results) { const track = await database.track.findFirst({ where: { source: seed.source, sourceTrackId: item.sourceTrackId, status:'PUBLISHED' }, select:{id:true,source:true,sourceTrackId:true,title:true,artistsText:true,albumName:true,genre:true,popularity:true,durationMs:true,explicit:true,catalogVersion:true} }); if (track && !excluded.has(track.id)) { const old=scores.get(track.id); scores.set(track.id,{score:(old?.score??0)+item.cosineSimilarity,seedCount:(old?.seedCount??0)+1}); } } }
    const tracks = await database.track.findMany({ where: { id: { in: [...scores.keys()] } }, select:{id:true,source:true,sourceTrackId:true,title:true,artistsText:true,albumName:true,genre:true,popularity:true,durationMs:true,explicit:true,catalogVersion:true} });
    const byId=new Map(tracks.map((t)=>[t.id,t])); const artists=new Set<string>(); const data=[...scores.entries()].map(([id,v])=>({track:byId.get(id)!, rankingScore:v.score/v.seedCount, seedCount:v.seedCount})).filter((x)=>x.track).sort((a,b)=>b.rankingScore-a.rankingScore).filter((x)=>{if(mode==='familiar')return true; if(artists.has(x.track.artistsText)&&mode==='balanced')return false; artists.add(x.track.artistsText); return true;}).slice(0,limit).map((x)=>({...x, reasonCode:x.seedCount>1?'MATCHES_MULTIPLE_LIKED_TRACKS':'SIMILAR_TO_LIKED_TRACK'}));
    res.json({ data, meta:{ coldStart:false, mode, requestId:res.locals.requestId } });
  });
  return router;
}

import type { PrismaClient } from '../generated/prisma/client.js';
import { HttpError } from '../middleware/errors.js';
import { getTrack } from '../catalog/service.js';
import type { RecommenderClient } from './client.js';

export async function findSimilar(db: PrismaClient, client: RecommenderClient, trackId: string, limit: number) {
  const seed = await getTrack(db, trackId);
  let response;
  try { response = await client.similar({ sourceTrackId: seed.sourceTrackId, catalogVersion: seed.catalogVersion, limit }); }
  catch (error) {
    if (error instanceof Error && error.message.includes('catalog')) throw new HttpError(502, 'RECOMMENDER_CATALOG_MISMATCH', 'errors.recommenderCatalogMismatch', 'The recommendation catalog does not match the website catalog.');
    if (error instanceof Error && error.message.includes('invalid')) throw new HttpError(502, 'RECOMMENDER_INVALID_RESPONSE', 'errors.recommenderInvalidResponse', 'The recommendation service returned an invalid response.');
    throw new HttpError(503, 'RECOMMENDER_UNAVAILABLE', 'errors.recommenderUnavailable', 'The recommendation service is unavailable.');
  }
  if (response.catalogVersion !== seed.catalogVersion || response.seedSourceTrackId !== seed.sourceTrackId) {
    throw new HttpError(502, 'RECOMMENDER_CATALOG_MISMATCH', 'errors.recommenderCatalogMismatch', 'The recommendation catalog does not match the website catalog.');
  }
  const tracks = await db.track.findMany({ where: { status: 'PUBLISHED', source: seed.source, sourceTrackId: { in: response.results.map((item) => item.sourceTrackId) } }, select: {
    id: true, source: true, sourceTrackId: true, title: true, artistsText: true, albumName: true, genre: true,
    popularity: true, durationMs: true, explicit: true, catalogVersion: true,
  } });
  const bySource = new Map(tracks.map((track) => [track.sourceTrackId, track]));
  const data = response.results.flatMap((item) => { const track = bySource.get(item.sourceTrackId); return track ? [{ track, similarity: item.cosineSimilarity, reasonCode: item.reasonCode }] : []; });
  return { data, meta: { seedTrackId: seed.id, sourceTrackId: seed.sourceTrackId, catalogVersion: response.catalogVersion, modelVersion: response.modelVersion } };
}

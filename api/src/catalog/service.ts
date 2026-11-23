import { Prisma, type PrismaClient } from '../generated/prisma/client.js';
import { HttpError } from '../middleware/errors.js';
import { normalizeSearch } from './validation.js';

export const publicTrack = {
  id: true, source: true, sourceTrackId: true, title: true, artistsText: true,
  albumName: true, genre: true, popularity: true, durationMs: true,
  explicit: true, catalogVersion: true,
} satisfies Prisma.TrackSelect;

export interface CatalogQuery { page: number; limit: number; q?: string; type?: 'track' | 'artist' }

export async function listTracks(db: PrismaClient, query: CatalogQuery) {
  const { page, limit, q = '', type = 'track' } = query;
  const term = normalizeSearch(q);
  // SQLite LIKE treats % and _ as wildcards. instr performs literal substring
  // search; Prisma.sql binds the term/limits as values, never as SQL syntax.
  const search = type === 'artist'
    ? Prisma.sql`instr("searchArtists", ${term}) > 0`
    : Prisma.sql`instr("searchTitle", ${term}) > 0`;
  return db.$transaction(async (tx) => {
    const counts = await tx.$queryRaw<{ total: bigint | number }[]>(Prisma.sql`
      SELECT COUNT(*) AS total FROM "Track" WHERE "status" = 'PUBLISHED' AND ${search}`);
    const ids = await tx.$queryRaw<{ id: string }[]>(Prisma.sql`
      SELECT "id" FROM "Track" WHERE "status" = 'PUBLISHED' AND ${search}
      ORDER BY "searchTitle" ASC, "id" ASC LIMIT ${limit} OFFSET ${(page - 1) * limit}`);
    const records = await tx.track.findMany({ where: { id: { in: ids.map((row) => row.id) } }, select: publicTrack });
    const byId = new Map(records.map((record) => [record.id, record]));
    const total = Number(counts[0]?.total ?? 0);
    return { data: ids.map(({ id }) => byId.get(id)!), meta: { page, limit, total, hasNext: page * limit < total } };
  });
}

export async function getTrack(db: PrismaClient, id: string) {
  const track = await db.track.findFirst({ where: { id, status: 'PUBLISHED' }, select: publicTrack });
  if (!track) throw new HttpError(404, 'NOT_FOUND', 'errors.notFound', 'The requested resource was not found.');
  return track;
}

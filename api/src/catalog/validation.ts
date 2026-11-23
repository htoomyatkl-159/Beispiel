import { z } from 'zod';
import { HttpError } from '../middleware/errors.js';

const positiveInteger = (fallback: string, maximum: number) => z.string().regex(/^\d+$/)
  .default(fallback).transform(Number).pipe(z.number().int().min(1).max(maximum));
const pagination = { page: positiveInteger('1', 1_000_000), limit: positiveInteger('20', 100) };
const listQuery = z.object(pagination).strict();
const searchQuery = z.object({ ...pagination, q: z.string().trim().max(200).default(''),
  type: z.enum(['track', 'artist']).default('track') }).strict();

function parse<T>(schema: z.ZodType<T>, value: unknown): T {
  const result = schema.safeParse(value);
  if (!result.success) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'errors.validation',
      'Invalid parameters. Use page=1..1000000, limit=1..100; search accepts q (up to 200 characters) and type=track|artist.');
  }
  return result.data;
}

export const parseListQuery = (value: unknown) => parse(listQuery, value);
export const parseSearchQuery = (value: unknown) => parse(searchQuery, value);
export function parseTrackId(value: unknown): string {
  const result = z.string().regex(/^[A-Za-z0-9_-]{1,100}$/).safeParse(value);
  if (!result.success) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'errors.validation', 'Use a valid internal track ID returned by the catalog.');
  }
  return result.data;
}
export const normalizeSearch = (value: string) => value.normalize('NFC').toLowerCase();

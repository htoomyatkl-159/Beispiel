export interface Track {
  id: string;
  source: string;
  sourceTrackId: string;
  title: string;
  artistsText: string;
  albumName: string | null;
  genre: string;
  popularity: number | null;
  durationMs: number | null;
  explicit: boolean;
  catalogVersion: string;
}

export interface PageResult {
  data: Track[];
  meta: { page: number; limit: number; total: number; hasNext: boolean; requestId: string };
}
export interface TrackResult { data: Track; meta: { requestId: string } }
export interface SimilarRecommendation { track: Track; similarity: number; reasonCode: string }
export interface SimilarResult { data: SimilarRecommendation[]; meta: { seedTrackId: string; sourceTrackId: string; catalogVersion: string; modelVersion: string; requestId: string } }

export class ApiError extends Error {
  status: number;
  requestId?: string;
  constructor(status: number, requestId?: string) {
    super('The catalog request could not be completed.');
    this.status = status;
    this.requestId = requestId;
  }
}

const base = (import.meta.env.VITE_API_BASE_URL || '/api/v1').replace(/\/$/, '');

async function get<T>(path: string, signal?: AbortSignal, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${base}${path}`, { ...init, signal, headers: { Accept: 'application/json', ...init.headers } });
  const payload = await response.json().catch(() => null);
  if (!response.ok || payload === null) {
    throw new ApiError(response.status, payload?.error?.requestId);
  }
  return payload as T;
}

export const catalog = {
  list: (page: number, limit = 12, signal?: AbortSignal) =>
    get<PageResult>(`/tracks?${new URLSearchParams({ page: String(page), limit: String(limit) })}`, signal),
  search: (q: string, type: 'track' | 'artist', page: number, signal?: AbortSignal) =>
    get<PageResult>(`/search?${new URLSearchParams({ q, type, page: String(page), limit: '12' })}`, signal),
  track: (id: string, signal?: AbortSignal) => get<TrackResult>(`/tracks/${encodeURIComponent(id)}`, signal),
};

export const recommendations = {
  similar: (trackId: string, limit = 5, signal?: AbortSignal) => get<SimilarResult>('/recommendations/similar', signal, {
    method: 'POST', body: JSON.stringify({ trackId, limit }), headers: { 'Content-Type': 'application/json' },
  }),
};

export function readPage(value: string | null): number {
  const page = Number(value);
  return value && /^\d+$/.test(value) && page >= 1 && page <= 1_000_000 ? page : 1;
}

export function duration(value: number | null): string {
  if (value === null) return '—';
  const seconds = Math.floor(value / 1000);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

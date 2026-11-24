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
export interface User { id: string; email: string; displayName: string; role: string; createdAt: string }

export class ApiError extends Error {
  status: number;
  requestId?: string;
  messageKey?: string;
  constructor(status: number, requestId?: string, messageKey?: string, message = 'The request could not be completed.') {
    super(message);
    this.status = status;
    this.requestId = requestId;
    this.messageKey = messageKey;
  }
}

const base = (import.meta.env.VITE_API_BASE_URL || '/api/v1').replace(/\/$/, '');

async function get<T>(path: string, signal?: AbortSignal, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${base}${path}`, { ...init, credentials: 'include', signal, headers: { Accept: 'application/json', ...init.headers } });
  const payload = await response.json().catch(() => null);
  if (!response.ok || payload === null) {
    throw new ApiError(response.status, payload?.error?.requestId, payload?.error?.messageKey, payload?.error?.message);
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

export const auth = {
  register: (input: { email: string; password: string; displayName: string }) => get<{ data: User }>('/auth/register', undefined, { method: 'POST', body: JSON.stringify(input), headers: { 'Content-Type': 'application/json' } }),
  login: (input: { email: string; password: string }) => get<{ data: User }>('/auth/login', undefined, { method: 'POST', body: JSON.stringify(input), headers: { 'Content-Type': 'application/json' } }),
  me: () => get<{ data: User }>('/auth/me'),
  logout: () => get<{ data: { loggedOut: boolean } }>('/auth/logout', undefined, { method: 'POST', body: '{}', headers: { 'Content-Type': 'application/json' } }),
};
export const feedback = {
  get: (trackId: string) => get<{ data: { feedbackType: string } | null }>(`/tracks/${encodeURIComponent(trackId)}/feedback`),
  set: (trackId: string, feedbackType: 'LIKE' | 'DISLIKE') => get<{ data: unknown }>(`/tracks/${encodeURIComponent(trackId)}/feedback`, undefined, { method: 'PUT', body: JSON.stringify({ feedbackType }), headers: { 'Content-Type': 'application/json' } }),
  remove: (trackId: string) => get<{ data: unknown }>(`/tracks/${encodeURIComponent(trackId)}/feedback`, undefined, { method: 'DELETE', headers: { 'Content-Type': 'application/json' } }),
};
export const personalized = { forYou: (mode: 'familiar'|'balanced'|'adventurous' = 'balanced') => get<{ data: Array<{ track: Track; rankingScore: number; seedCount: number; reasonCode: string }>; meta: { coldStart: boolean; mode: string; requestId: string } }>(`/recommendations/for-you?mode=${mode}`) };

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
